/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="./PhotoboxUtils.ts" />

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

	private _tag : string;

	constructor(id : string) {
		this._id = id;
		this._cloudStorage = false;
		this._pictureUrls = new Array<string>();
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
	private deleteLocal(hostname) {
		for (var key in this._pictureUrls) {
			var completeHostname = "http://"+hostname+"/";
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
	public deletePictures(hostname : string) {
		if (this._pictureUrls.length > 0) {
			if (this._cloudStorage) {
				this.deleteCloud();
			} else {
				this.deleteLocal(hostname);
			}
		} else {
			Logger.error("Unable to delete pictures in session "+this.getId()+" as the array is empty.");
		}
	}
}