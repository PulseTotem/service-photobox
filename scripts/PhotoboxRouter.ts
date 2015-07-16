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
	 * Constructor.
	 */
	constructor() {
		super();
	}

	/**
	 * Method called during Router creation.
	 *
	 * @method buildRouter
	 */
	buildRouter() {
		var self = this;

		// define the '/' route
		this.router.post('/preview', function(req : any, res : any) { self.startSession(req, res); });
		this.router.post('/validate', function(req : any, res : any) { self.endSession(req, res); });
		this.router.post('/counter', function(req : any, res : any) { self.counter(req, res); });
		this.router.post('/post/local', function(req : any, res : any) { self.postLocal(req, res); });
		this.router.post('/post/cloud', function(req : any, res : any) { self.postCloud(req, res); });
		this.router.post('/retry/local', function(req : any, res : any) { self.retry(req, res); });
		this.router.post('/retry/cloud', function(req : any, res : any) { self.retry(req, res, false); });
		this.router.post('/delete/local', function(req : any, res : any) { self.exitDelete(req, res); });
		this.router.post('/delete/cloud', function(req : any, res : any) { self.exitDelete(req, res, false); });
	}

	/**
	 * New Notification.
	 *
	 * @method newNotification
	 * @param {Express.Request} req - Request object.
	 * @param {Express.Response} res - Response object.
	 */
	startSession(req : any, res : any) {
		Logger.debug("Receive start session message");
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("startSession", req);

		res.end();
	}

	endSession(req : any, res : any) {
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("endSession", req);

		res.end();
	}

	counter(req : any, res : any) {
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("counter", req);

		res.end();
	}

	postLocal(req : any, res : any) {
		Logger.debug("Upload a picture locally");
		var self = this;
		var rootUpload =  Photobox.ROOT_UPLOAD+"/";
		var host = "http://"+req.headers.host+"/";

		fs.readFile(req.files.webcam.path, function (err, data) {

			var imageName = req.files.webcam.name;

			/// If there's an error
			if(!imageName){
				Logger.error("Error when uploading picture. Path : "+req.files.webcam.path);
				res.status(500).json({ error: 'Error when uploading picture' });
			} else {
				var newPath = rootUpload + imageName;
				var uploadedImages = [];

				fs.writeFile(newPath, data, function (err) {

					if (err) {
						Logger.error("Error when writing file : "+JSON.stringify(err));
						res.status(500).json({ error: 'Error when writing file'});
					} else {
						uploadedImages.push(host+newPath);

						var nameExt = self.getFileExtension(imageName);
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
											uploadedImages.push(host+newName);

											image.resize(320, 180, function (errscale, imageScale) {
												var newName = rootUpload + nameExt[0]+ "_320."+nameExt[1];
												imageScale.writeFile(newName, function (errWrite) {
													if (errWrite) {
														Logger.error("Error when resizing image in 320px wide");
														res.status(500).json({ error: 'Error when writing file'});
													} else {
														uploadedImages.push(host+newName);
														Logger.debug("All images saved : "+uploadedImages);
														res.status(200).json({message: "Upload ok", files: uploadedImages, type: "local"});
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

	getFileExtension(filename : string) : Array<string> {
		var res = [];
		var indexLastSlash = filename.lastIndexOf('/');
		var indexLastDot = filename.lastIndexOf('.');

		res.push(filename.substring(indexLastSlash+1, indexLastDot));
		res.push(filename.substring(indexLastDot+1, filename.length));
		return res;
	}

	postCloud(req : any, res : any) {
		Logger.debug("Upload a picture to cloudinary");
		cloudinary.config({
			cloud_name: 'pulsetotem',
			api_key: '961435335945823',
			api_secret: 'fBnekdGtXb8TOZs43dxIECvCX5c'
		});

		cloudinary.uploader.upload(req.files.webcam.path, function(result) {
			var uploadedImages = [];
			uploadedImages.push(result.url);

			var img_640 = cloudinary.url(result.public_id, { width: 640, height: 360, crop: 'scale' } );
			uploadedImages.push(img_640);

			var img_320 = cloudinary.url(result.public_id, { width: 320, height: 180, crop: 'scale' } );
			uploadedImages.push(img_320);

			Logger.debug("Upload the following images : "+JSON.stringify(uploadedImages));
			res.status(200).json({message: "Upload ok", files: uploadedImages, type: "cloud"});
		}, {
			tags: ['photobox']
		});
	}

	private deleteLocal(files, hostname) {
		for (var key in files) {
			var completeHostname = "http://"+hostname+"/";
			var file : string = files[key].substr(completeHostname.length);

			if (file.indexOf(Photobox.ROOT_UPLOAD) == 0 && file.length > Photobox.ROOT_UPLOAD.length+2) {
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
	}

	private deleteCloud(files) {
		var firstFile = files[0];
		var arrayExtension = this.getFileExtension(firstFile);
		var public_id = arrayExtension[0];
		cloudinary.api.delete_resources([public_id], function(result){});
	}

	retry(req : any, res : any, local = true) {
		var files = req.body;
		if (local) {
			this.deleteLocal(files, req.headers.host);
		} else {
			this.deleteCloud(files);
		}
		this.counter(req, res);
	}

	exitDelete(req : any, res : any, local = true) {
		var files = req.body;
		if (local) {
			this.deleteLocal(files, req.headers.host);
		} else {
			this.deleteCloud(files);
		}
		this.endSession(req, res);
	}
}