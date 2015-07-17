/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/RouterItf.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />

var fs : any = require('fs');
var lwip : any = require('lwip');
var cloudinary : any = require('cloudinary');

/**
 * NotifierRouter class.
 *
 * @class NotifierRouter
 * @extends RouterItf
 */
class PhotoboxRouter extends RouterItf {

	/**
	 * List of sessions currently opened
	 *
	 * @property _sessions
	 * @type {Array<PhotoboxSession>}
	 * @private
	 */
	private _sessions : Array<PhotoboxSession>;

	/**
	 * Constructor.
	 */
	constructor() {
		super();
		this._sessions = new Array<PhotoboxSession>();
	}

	/**
	 * Retrieve a session given its ID
	 *
	 * @method retrieveSession
	 * @param sessionId the ID of the session to retrieve
	 * @returns {PhotoboxSession} the session or null if no session has been found
	 */
	private retrieveSession(sessionId : string) : PhotoboxSession {
		for (var i = 0; i < this._sessions.length; i++) {
			if (this._sessions[i].getId() === sessionId) {
				return this._sessions[i];
			}
		}
		return null;
	}

	/**
	 * Delete a session from the list of sessions given the sessionId
	 *
	 * @method deleteSession
	 * @param sessionId The id of the session to remove
	 * @returns {boolean} true if the session has been deleted, false if no session has been found
	 * @private
	 */
	private deleteSession(sessionId : string) : boolean {
		var self = this;
		var findSession = function () {
			for (var i = 0; i < self._sessions.length; i++) {
				if (self._sessions[i].getId() === sessionId) {
					return i;
				}
			}
			return -1;
		};

		var index = findSession();

		if (index != -1) {
			this._sessions.splice(index, 1);
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Method called during Router creation.
	 *
	 * @method buildRouter
	 */
	buildRouter() {
		var self = this;

		// define the '/' route
		this.router.post('/start/:sessionid', function(req : any, res : any) { self.startSession(req, res); });
		this.router.post('/counter/:sessionid', function(req : any, res : any) { self.counter(req, res); });
		this.router.post('/post/:sessionid/:cloudStorage', function(req : any, res : any) { self.post(req, res); });

		this.router.post('/validate', function(req : any, res : any) { self.validate(req, res); });
		this.router.post('/retry/:sessionid', function(req : any, res : any) { self.retry(req, res); });
		this.router.post('/unvalidate/:sessionid', function(req : any, res : any) { self.unvalidate(req, res); });
	}

	/**
	 * Start a session with a given session id
	 *
	 * @method startSession
	 * @param {Express.Request} req - Request object.
	 * @param {Express.Response} res - Response object.
	 */
	startSession(req : any, res : any) {
		Logger.debug("Receive start session message");

		var sessionid = req.params.sessionid;
		var session = this.retrieveSession(sessionid);

		if (!sessionid || session != null) {
			res.status(500).send("Please send a valid and unique sessionid");
		} else {
			Logger.debug("Create session with id: "+sessionid);
			var session = new PhotoboxSession(sessionid);
			this._sessions.push(session);

			// TODO : It should not be a broadcast !
			this.server.broadcastExternalMessage("startSession", req);

			res.end();
		}
	}

	/**
	 * Launch a counter time to take the picture.
	 *
	 * @method counter
	 * @param req
	 * @param res
	 */
	counter(req : any, res : any) {
		var sessionid = req.params.sessionid;

		var session = this.retrieveSession(sessionid);
		if (session == null) {
			res.status(404).send("Session cannot be found.");
		} else {
			// TODO : It's not a broadcast !
			this.server.broadcastExternalMessage("counter", req);

			res.end();
		}
	}

	/**
	 * Post pictures
	 *
	 * @param req
	 * @param res
	 */
	post(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var cloudstorage = JSON.parse(req.params.cloudStorage);
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session == null) {
			res.status(404).send("Session cannot be found.");
		} else {
			session.setCloudStorage(cloudstorage);
			if (cloudstorage) {
				this.postCloud(req, res, session);
			} else {
				this.postLocal(req, res, session);
			}
		}
	}

	private postLocal(req : any, res : any, session : PhotoboxSession) {
		Logger.debug("Upload a picture locally");
		var self = this;
		var rootUpload =  PhotoboxUtils.ROOT_UPLOAD+"/";
		var host = "http://"+req.headers.host+"/";

		fs.readFile(req.files.webcam.path, function (err, data) {

			var imageName = req.files.webcam.name;

			/// If there's an error
			if(!imageName){
				Logger.error("Error when uploading picture. Path : "+req.files.webcam.path);
				res.status(500).json({ error: 'Error when uploading picture' });
			} else {
				var newPath = rootUpload + imageName;
				fs.writeFile(newPath, data, function (err) {

					if (err) {
						Logger.error("Error when writing file : "+JSON.stringify(err));
						res.status(500).json({ error: 'Error when writing file'});
					} else {
						session.addPictureURL(host+newPath);

						var nameExt = PhotoboxUtils.getFileExtension(imageName);
						lwip.open(newPath, function (errOpen, image) {
							if (errOpen) {
								Logger.error("Error when opening file with lwip");
								res.status(500).json({ error: 'Error when writing file'});
							} else {
								image.resize(640, 360, function (errscale, imageScale) {
									var newName = rootUpload + nameExt[0]+ "_640."+nameExt[1];
									imageScale.writeFile(newName, function (errWrite) {
										if (errWrite) {
											Logger.error("Error when resizing image in 640px wide");
											res.status(500).json({ error: 'Error when writing file'});
										} else {
											session.addPictureURL(host+newName);

											image.resize(320, 180, function (errscale, imageScale) {
												var newName = rootUpload + nameExt[0]+ "_320."+nameExt[1];
												imageScale.writeFile(newName, function (errWrite) {
													if (errWrite) {
														Logger.error("Error when resizing image in 320px wide");
														res.status(500).json({ error: 'Error when writing file'});
													} else {
														session.addPictureURL(host+newName);
														Logger.debug("All images saved : "+JSON.stringify(session.getPicturesURL()));
														res.status(200).json({message: "Upload ok", files: session.getPicturesURL()});
													}
												})
											});
										}
									})
								});
							}
						});

					}
				});
			}
		});
	}

	private postCloud(req : any, res : any, session : PhotoboxSession) {
		Logger.debug("Upload a picture to cloudinary");
		cloudinary.config({
			cloud_name: 'pulsetotem',
			api_key: '961435335945823',
			api_secret: 'fBnekdGtXb8TOZs43dxIECvCX5c'
		});

		cloudinary.uploader.upload(req.files.webcam.path, function(result) {
			session.addPictureURL(result.url);

			var img_640 = cloudinary.url(result.public_id, { width: 640, height: 360, crop: 'scale' } );
			session.addPictureURL(img_640);

			var img_320 = cloudinary.url(result.public_id, { width: 320, height: 180, crop: 'scale' } );
			session.addPictureURL(img_320);

			Logger.debug("Upload the following images : "+JSON.stringify(session.getPicturesURL()));
			res.status(200).json({message: "Upload ok", files: session.getPicturesURL()});
		}, {
			tags: ['photobox']
		});
	}


	validate(req : any, res : any) {

		var sessionid = req.params.sessionid;
		var del = this.deleteSession(sessionid);

		if (del) {
			// TODO : It's not a broadcast !
			this.server.broadcastExternalMessage("endSession", req);
			res.end();
		} else {
			res.status(404).send("Session cannot be found.");
		}

	}

	unvalidate(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session != null) {
			session.deletePictures(req.headers.host);
			this.deleteSession(sessionid);
			this.server.broadcastExternalMessage("endSession", req);
			res.end();
		} else {
			res.status(404).send("Session cannot be found.");
		}

	}

	retry(req : any, res : any, local = true) {
		var sessionid = req.params.sessionid;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session != null) {
			session.deletePictures(req.headers.host);
			this.server.broadcastExternalMessage("counter", req);
			res.end();
		} else {
			res.status(404).send("Session cannot be found.");
		}
	}

}