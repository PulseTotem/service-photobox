/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="./PhotoboxUtils.ts" />
/// <reference path="./PhotoboxSessionStep.ts" />

/**
 * Represents a Session for Photobox usage.
 *
 * @class PhotoboxSession
 */
class PhotoboxSession {

	/**
	 * Unique identifier for the session
	 *
	 * @property _id
	 * @type {string}
	 * @private
	 */
	private _id : string;

	/**
	 * Define if the storage is in cloud or local
	 *
	 * @property _cloudStorage
	 * @type {boolean}
	 * @private
	 */
	private _cloudStorage : boolean;

	/**
	 * The list of 3 pictures taken : the first one is the original, the second one is a medium size and the last one is the small size.
	 *
	 * @property _pictureUrls
	 * @type {Array<string>}
	 * @private
	 */
	private _pictureUrls : Array<string>;

	/**
	 * The tag name of the album for this session
	 *
	 * @property _tag
	 * @type string
	 * @private
	 */
	private _tag : string;

	/**
	 * The step reached by the session
	 *
	 * @property _step
	 * @type {PhotoboxSessionStep}
	 * @private
	 */
	private _step : PhotoboxSessionStep;

	/**
	 * The launched timeout.
	 *
	 * @property _timeout
	 * @private
	 */
	private _timeout : any;

	/**
	 * The server to manipulate throughout the different steps
	 */
	private _server : Server;

	constructor(id : string, server : Server) {
		this._id = id;
		this._server = server;
		this._cloudStorage = false;
		this._pictureUrls = new Array<string>();
		this._timeout = null;
	}



	/**
	 *
	 * @method getId
	 * @returns {string} The session ID
	 */
	public getId() {
		return this._id;
	}

	/**
	 * @method getCloudStorage
	 * @returns {boolean}
	 */
	public getCloudStorage() {
		return this._cloudStorage;
	}

	/**
	 * @method getPicturesURL
	 * @returns {Array<string>} Return the URLs of the pictures
	 */
	public getPicturesURL() {
		return this._pictureUrls;
	}

	/**
	 * Define CloudStorage value.
	 * @method setCloudStorage
	 * @param cloudStorage
	 */
	public setCloudStorage(cloudStorage : boolean) {
		this._cloudStorage = cloudStorage;
	}

	/**
	 * Add a new picture URL
	 * @method addPictureURL
	 * @param url
	 */
	public addPictureURL(url : string) {
		this._pictureUrls.push(url);
	}

	/**
	 * Set the tag for the session
	 *
	 * @method setTag
	 * @param tag
	 */
	public setTag(tag : string) {
		this._tag = tag;
	}

	/**
	 *
	 * @returns {string}
	 */
	public getTag() {
		return this._tag;
	}

	/**
	 * Delete pictures stored locally. This method needs the hostname in order to treat picture URLs.
	 *
	 * @method deleteLocal
	 * @param hostname
	 * @private
	 */
	private deleteLocal() {
		for (var key in this._pictureUrls) {
			var completeHostname = "http://"+Photobox.host+"/";
			var file : string = this._pictureUrls[key].substr(completeHostname.length);

			if (file.indexOf(Photobox.upload_directory) == 0 && file.length > Photobox.upload_directory.length+2) {
				try {
					fs.unlinkSync(file);
					Logger.debug("Delete the following file: "+file);
				} catch (e) {
					Logger.error("Error when trying to delete the following file: "+file+". "+e);
				}
			} else {
				Logger.info("Try to delete an unauthorized file : "+file);
			}
		}
		this._pictureUrls = new Array<string>();
	}

	/**
	 * Delete pictures stored on cloudinary.
	 *
	 * @method deleteCloud
	 * @private
	 */
	private deleteCloud() {
		var firstFile = this._pictureUrls[0];
		var arrayExtension = PhotoboxUtils.getFileExtension(firstFile);
		var public_id = arrayExtension[0];
		cloudinary.api.delete_resources([public_id], function(result){});
		this._pictureUrls = new Array<string>();
	}

	/**
	 * Delete pictures previously taken.
	 *
	 * @param hostname
	 * @method deletePictures
	 */
	public deletePictures() {
		Logger.debug("Delete pictures in session "+this._id);
		if (this._pictureUrls.length > 0) {
			if (this._cloudStorage) {
				this.deleteCloud();
			} else {
				this.deleteLocal();
			}
		} else {
			Logger.error("Unable to delete pictures in session "+this.getId()+" as the array is empty.");
		}
	}

	//////// METHODS TO MANIPULATE THE SESSION

	private reachedTimeout() {
		Logger.debug("Reached timeout for session "+this._id);
		this._step = PhotoboxSessionStep.END;
		if (this._pictureUrls.length > 0) {
			this.deletePictures();
		}
	}

	/**
	 * First step of the session : start should set the step and launch a message via namespace managers.
	 * If nothing is done during a timeout duration (see PhotoboxUtils), the session should end.
	 *
	 * @param res : The response object
	 */
	public start(res : any) {
		// TODO : It should not be a broadcast !
		var ack = this._server.broadcastExternalMessage("startSession", this);

		if (ack) {
			res.end();
			this._step = PhotoboxSessionStep.START;
			this._timeout = setTimeout(this.reachedTimeout, PhotoboxUtils.TIMEOUT_DURATION*1000);
		} else {
			res.status(500).send("No client is currently connected.");
			this._step = PhotoboxSessionStep.END;
		}
	}
}