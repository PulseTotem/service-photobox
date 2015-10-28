/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="./PhotoboxUtils.ts" />
/// <reference path="./PhotoboxSessionStep.ts" />
/// <reference path="./LogSession.ts" />


var fs : any = require('fs');
var lwip : any = require('lwip');
var request : any = require('request');

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
	 * The list of 3 pictures URL taken : the first one is the original, the second one is a medium size and the last one is the small size.
	 *
	 * @property _pictureUrls
	 * @type {Array<string>}
	 * @private
	 */
	private _pictureUrls : Array<string>;

	/**
	 * The list of paths for local pictures
	 *
	 * @property _localPictures
	 * @type {Array<String>}
	 * @private
	 */
	private _localPictures : Array<string>;

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

	/**
	 * URL of the watermark to use when posting a picture
	 */
	private _watermarkURL : string;

	/**
	 * Duration of the counter to take the picture
	 */
	private _counterDuration : number;

	/**
	 * Allow to keep an update statut for LogSession information
	 */
	private _logSession : LogSession;

	constructor(id : string, server : Server) {
		this._id = id;
		this._server = server;
		this._pictureUrls = new Array<string>();
		this._localPictures = new Array<string>();
		this._timeout = null;
		this._counterDuration = 0;
		this._watermarkURL = "";
		this._logSession = new LogSession(id);
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
	 * @method getPicturesURL
	 * @returns {Array<string>} Return the URLs of the pictures
	 */
	public getPicturesURL() {
		return this._pictureUrls;
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

	public getStep() {
		return this._step;
	}

	/**
	 * Set the watermark URL to use when posting picture
	 * @param wurl URL of the watermark
	 */
	public setWatermarkURL(wurl : string) {
		this._watermarkURL = wurl;
	}

	/**
	 * Set the counterDuration using to set the timeout when posting picture (see http://jira.the6thscreen.fr/browse/SERVICES-99)
	 * @param duration
	 */
	public setCounterDuration(duration : number) {
		this._counterDuration = duration;
	}

	public getLogSession() : LogSession {
		return this._logSession;
	}

	/**
	 * Delete pictures stored locally. This method needs the hostname in order to treat picture URLs.
	 *
	 * @method deleteLocal
	 * @param hostname
	 * @private
	 */
	private deleteLocal() {
		for (var key in this._localPictures) {
			var file : string = this._localPictures[key];

			try {
				fs.unlinkSync(file);
				Logger.debug("Delete the following file: "+file);
			} catch (e) {
				Logger.error("Error when trying to delete the following file: "+file+". "+e);
			}
		}
		this._pictureUrls = new Array<string>();
		this._localPictures = new Array<string>();
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
				this.deleteLocal();
		} else {
			Logger.error("Unable to delete pictures in session "+this.getId()+" as the array is empty.");
		}
	}

	//////// METHODS TO MANIPULATE THE SESSION

	public killSession() {
		Logger.debug("Kill the following session :"+this._id);
		this._logSession.setStatut("KILLED");
		if (this._timeout) {
			clearTimeout(this._timeout);
		}
		this.closeSession();
		if (this._pictureUrls.length > 0) {
			this.deletePictures();
		}
	}

	/**
	 * Method to call when the timeout is reached in any step.
	 */
	private reachedTimeout() {
		Logger.debug("Reached timeout for session "+this._id);
		this._logSession.setStatut("TIMEOUT");
		this.closeSession();
		if (this._pictureUrls.length > 0) {
			this.deletePictures();
		}
	}

	private closeSession() {
		this._step = PhotoboxSessionStep.END;
		this._server.broadcastExternalMessage("endSession", this);
		this.flushSession();
	}

	/**
	 * First step of the session : start should set the step and launch a message via namespace managers.
	 * If nothing is done during a timeout duration (see PhotoboxUtils), the session should end.
	 *
	 * @param res : The response object
	 */
	public start(res : any) {
		Logger.debug("Start session : "+this._id);
		var self = this;
		if (this._step != null) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			// TODO : It should not be a broadcast !
			var ack = this._server.broadcastExternalMessage("startSession", this);

			if (ack) {
				res.end();
				this._step = PhotoboxSessionStep.START;
				if (this._timeout) {
					clearTimeout(this._timeout);
				}
				this._timeout = setTimeout(function() { self.reachedTimeout(); }, PhotoboxUtils.TIMEOUT_DURATION*1000);
			} else {
				res.status(500).send("No client is currently connected.");
				this.closeSession();
			}
		}
	}

	/**
	 * Second step of the session : counter should stop the timeout of first step, set the step and launch a message via namespace managers.
	 *
	 * @param res
	 */
	public counter(res : any) {
		Logger.debug("Counter for session : "+this._id);
		var self = this;
		if (this._step != PhotoboxSessionStep.START) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);

			var ack = this._server.broadcastExternalMessage("counter", this);

			if (ack) {
				this._logSession.setStatut("COUNTER");
				res.end();
				this._step = PhotoboxSessionStep.COUNTER;
				if (this._timeout) {
					clearTimeout(this._timeout);
				}
				this._timeout = setTimeout(function() { self.reachedTimeout(); }, (this._counterDuration+PhotoboxUtils.TIMEOUT_DURATION)*1000);
			} else {
				res.status(500).send("No client is currently connected.");
				this.closeSession();
			}
		}
	}

	public post(imageData : any, res : any) {
		Logger.debug("Post picture on session : "+this._id);
		if (this._step != PhotoboxSessionStep.COUNTER) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);
			this._logSession.setStatut("POSTING");
			this._step = PhotoboxSessionStep.POSTING;
			this.postLocal(imageData, res);
		}
	}

	private postLocal(imageData : any, res : any) {
		Logger.debug("Photobox Session "+this._id+" | Upload a picture locally");
		var self = this;
		var uploadDir = PhotoboxUtils.getDirectoryFromTag(this._tag);

		// first we read the uploaded file
		fs.readFile(imageData.path, function (err, data) {

			// manage error
			if (err) {
				res.status(500).json({ error: 'Error when retrieving the file'});
				self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);

			// everything's ok for reading
			} else {

				// get pathes for the 3 images
				var newPathes = PhotoboxUtils.getNewImageNamesFromOriginalImage(imageData.name);

				// write the original image to the right place
				fs.writeFile(uploadDir+newPathes[0], data, function (err) {

					// manage error
					if (err) {
						Logger.error("Error when writing file : "+JSON.stringify(err));
						res.status(500).json({ error: 'Error when writing file'});
						self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);

					// everything's ok after writing the original image
					} else {

						// open the image with lwip for resizing
						lwip.open(uploadDir+newPathes[0], function (errOpen, image) {

							// in case of errors, it logs but it also delete the file on disk.
							if (errOpen) {
								Logger.error("Error when opening file with lwip"+JSON.stringify(errOpen));
								res.status(500).json({ error: 'Error when writing file'});
								fs.unlinkSync(uploadDir+newPathes[0]);
								self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);

							// the image is opened with lwip
							} else {

								var local_watermark : string = "/tmp/watermark.png";

								var fail = function (error) {
									Logger.error("Error when retrieving the logo picture for watermark. Error: "+JSON.stringify(error));
									res.status(500).json({ error: 'Error when writing file'});
									fs.unlinkSync(uploadDir+newPathes[0]);
									self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
								};

								var successDownloadLogo = function () {
									lwip.open(local_watermark, function (errOpen, img_watermark) {
										if (errOpen) {
											Logger.error("Error when opening file with lwip"+JSON.stringify(errOpen));
											res.status(500).json({ error: 'Error when writing file'});
											fs.unlinkSync(uploadDir+newPathes[0]);
											self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
										} else {
											image.paste(0, (image.height()-img_watermark.height()), img_watermark, function (errPaste, imgWatermarked) {
												if (errPaste) {
													Logger.error("Error when pasting file with lwip"+JSON.stringify(errPaste));
													res.status(500).json({ error: 'Error when writing file'});
													fs.unlinkSync(uploadDir+newPathes[0]);
													self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
												} else {
													imgWatermarked.writeFile(uploadDir+newPathes[0], function (errWriteW) {
														if (errWriteW) {
															Logger.error("Error when pasting file with lwip"+JSON.stringify(errPaste));
															res.status(500).json({ error: 'Error when writing file'});
															fs.unlinkSync(uploadDir+newPathes[0]);
															self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
														} else {
															// resize the picture to medium picture
															imgWatermarked.resize(PhotoboxUtils.MIDDLE_SIZE.width, PhotoboxUtils.MIDDLE_SIZE.height, function (errscale, imageScale) {

																if (errscale) {
																	Logger.error("Error when scaling original file with lwip"+JSON.stringify(errscale));
																	res.status(500).json({ error: 'Error when writing file'});
																	fs.unlinkSync(uploadDir+newPathes[0]);
																	self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
																} else {
																	imageScale.writeFile(uploadDir+newPathes[1], function (errWrite) {

																		if (errWrite) {
																			Logger.error("Error when writing the first scaling file with lwip"+JSON.stringify(errOpen));
																			res.status(500).json({ error: 'Error when writing file'});
																			fs.unlinkSync(uploadDir+newPathes[0]);
																			self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
																		} else {
																			imgWatermarked.resize(PhotoboxUtils.SMALL_SIZE.width, PhotoboxUtils.SMALL_SIZE.height, function (errscale2, imageScale2) {

																				if (errscale2) {
																					Logger.error("Error when scaling original file with lwip a second time "+JSON.stringify(errscale2));
																					res.status(500).json({ error: 'Error when writing file'});
																					fs.unlinkSync(uploadDir+newPathes[0]);
																					fs.unlinkSync(uploadDir+newPathes[1]);
																					self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
																				} else {
																					imageScale2.writeFile(uploadDir+newPathes[2], function (errWrite) {
																						if (errWrite) {
																							Logger.error("Error when resizing image in small size "+JSON.stringify(errWrite));
																							res.status(500).json({ error: 'Error when writing file'});
																							fs.unlinkSync(uploadDir+newPathes[0]);
																							fs.unlinkSync(uploadDir+newPathes[1]);
																							self._timeout = setTimeout(function() { self.reachedTimeout(); }, 10000);
																						} else {
																							self.addPictureURL(PhotoboxUtils.getBaseURL(self.getTag())+newPathes[0]);
																							self._localPictures.push(uploadDir+newPathes[0]);

																							self.addPictureURL(PhotoboxUtils.getBaseURL(self.getTag())+newPathes[1]);
																							self._localPictures.push(uploadDir+newPathes[1]);

																							self.addPictureURL(PhotoboxUtils.getBaseURL(self.getTag())+newPathes[2]);
																							self._localPictures.push(uploadDir+newPathes[2]);

																							self._step = PhotoboxSessionStep.PENDINGVALIDATION;
																							self._logSession.setStatut("PENDINGVALIDATION");
																							if (self._timeout) {
																								clearTimeout(self._timeout);
																							}
																							self._timeout = setTimeout(function() { self.reachedTimeout(); }, PhotoboxUtils.TIMEOUT_DURATION*1000);

																							Logger.debug("All images saved : "+JSON.stringify(self.getPicturesURL()));
																							res.status(200).json({message: "Upload ok", files: self.getPicturesURL()});
																						}
																					});
																				}
																			});
																		}
																	});
																}
															});
														}
													})
												}
											})
										}
									});
								};

								PhotoboxUtils.downloadFile(self._watermarkURL,local_watermark, successDownloadLogo, fail);
							}
						});
					}
				});
			}
		});
	}

	public validate(res : any) {
		Logger.debug("Validate picture for session : "+this._id);

		if (this._step != PhotoboxSessionStep.PENDINGVALIDATION) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);
			this._logSession.setStatut("VALIDATE");
			this._server.broadcastExternalMessage("newPicture", {tag: this.getTag(), pics: this.getPicturesURL()});
			this.closeSession();

			res.end();
		}
	}

	public unvalidate(res : any) {
		Logger.debug("Unvalidate picture for session : "+this._id);

		if (this._step != PhotoboxSessionStep.PENDINGVALIDATION) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);
			this._logSession.setStatut("UNVALIDATE");
			this.deletePictures();
			this.closeSession();

			res.end();
		}
	}

	private flushSession() {
		var sessionFile = Photobox.upload_directory+"/sessions.log";

		var session = this._logSession;
		var content = session.getDate()+"\t"+session.getId()+"\t"+session.getStatut()+"\n";
		fs.appendFileSync(sessionFile, content);
	}
}