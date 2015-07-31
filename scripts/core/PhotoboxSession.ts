/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="./PhotoboxUtils.ts" />
/// <reference path="./PhotoboxSessionStep.ts" />


var fs : any = require('fs');
var lwip : any = require('lwip');
var cloudinary : any = require('cloudinary');

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

	constructor(id : string, server : Server) {
		this._id = id;
		this._server = server;
		this._cloudStorage = false;
		this._pictureUrls = new Array<string>();
		this._localPictures = new Array<string>();
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

	public getStep() {
		return this._step;
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

	/**
	 * Method to call when the timeout is reached in any step.
	 */
	private reachedTimeout() {
		Logger.debug("Reached timeout for session "+this._id);
		this._step = PhotoboxSessionStep.END;
		if (this._pictureUrls.length > 0) {
			this.deletePictures();
		}
		this._server.broadcastExternalMessage("endSession", this);
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
				this._timeout = setTimeout(function() { self.reachedTimeout(); }, PhotoboxUtils.TIMEOUT_DURATION*1000);
			} else {
				res.status(500).send("No client is currently connected.");
				this._step = PhotoboxSessionStep.END;
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
				res.end();
				this._step = PhotoboxSessionStep.COUNTER;
				this._timeout = setTimeout(function() { self.reachedTimeout(); }, PhotoboxUtils.TIMEOUT_DURATION*1000);
			} else {
				res.status(500).send("No client is currently connected.");
				this._server.broadcastExternalMessage("endSession", this);
				this._step = PhotoboxSessionStep.END;
			}
		}
	}

	public post(imageData : any, res : any) {
		Logger.debug("Post picture on session : "+this._id);
		if (this._step != PhotoboxSessionStep.COUNTER) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);

			if (this.getCloudStorage()) {
				this.postCloud(imageData, res);
			} else {
				this.postLocal(imageData, res);
			}
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

								var watermark : string = "http://www.the6thscreen.fr/assets/img/photobox/watermark_fetedelascience.png";
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
											image.paste(0, (image.width()-img_watermark.width()), img_watermark, function (errPaste, imgWatermarked) {
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

								PhotoboxUtils.downloadFile(watermark,local_watermark, successDownloadLogo, fail);
							}
						});
					}
				});
			}
		});
	}

	private postCloud(imageData : any, res : any) {
		Logger.debug("Upload a picture to cloudinary");
		var self = this;
		PhotoboxUtils.configCloudinary();
		cloudinary.uploader.upload(imageData.path, function(result) {
			if (result.url != "undefined") {
				self.addPictureURL(result.url);

				var img_640 = cloudinary.url(result.public_id, { width: PhotoboxUtils.MIDDLE_SIZE.width, height: PhotoboxUtils.MIDDLE_SIZE.height, crop: 'scale' } );
				self.addPictureURL(img_640);

				var img_320 = cloudinary.url(result.public_id, { width: PhotoboxUtils.SMALL_SIZE.width, height: PhotoboxUtils.SMALL_SIZE.height, crop: 'scale' } );
				self.addPictureURL(img_320);

				self._step = PhotoboxSessionStep.PENDINGVALIDATION;
				self._timeout = setTimeout(function() { self.reachedTimeout(); }, PhotoboxUtils.TIMEOUT_DURATION*1000);

				Logger.debug("Upload the following images : "+JSON.stringify(self.getPicturesURL()));
				res.status(200).json({message: "Upload ok", files: self.getPicturesURL()});
			} else {
				Logger.error("Error when uploading picture via cloudinary: "+JSON.stringify(result));
				res.status(500).json({error: 'Error when uploading on cloudinary.'});
			}
		}, {
			tags: ['photobox', self.getTag()]
		});
	}

	public validate(res : any) {
		Logger.debug("Validate picture for session : "+this._id);

		if (this._step != PhotoboxSessionStep.PENDINGVALIDATION) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);
			this._server.broadcastExternalMessage("newPicture", {tag: this.getTag(), pics: this.getPicturesURL()});
			this._server.broadcastExternalMessage("endSession", this);

			res.end();
			this._step = PhotoboxSessionStep.END;
		}
	}

	public unvalidate(res : any) {
		Logger.debug("Unvalidate picture for session : "+this._id);

		if (this._step != PhotoboxSessionStep.PENDINGVALIDATION) {
			res.status(500).send("Illegal action for the session state ! (state = "+PhotoboxSessionStep[this._step]+")");
		} else {
			clearTimeout(this._timeout);
			this.deletePictures();
			this._server.broadcastExternalMessage("endSession", this);

			res.end();
			this._step = PhotoboxSessionStep.END;
		}
	}
}