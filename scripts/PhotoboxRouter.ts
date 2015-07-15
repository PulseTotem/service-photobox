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
		this.router.post('/startSession', function(req : any, res : any) { self.startSession(req, res); });
		this.router.post('/endSession', function(req : any, res : any) { self.endSession(req, res); });
		this.router.post('/counter', function(req : any, res : any) { self.counter(req, res); });
		this.router.post('/postPic', function(req : any, res : any) { self.postPic(req, res); });
		this.router.post('/cloudinaryPic', function(req : any, res : any) { self.cloudinaryPic(req, res); });
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
		this.server.broadcastExternalMessage("startSession", req.body);

		res.end();
	}

	endSession(req : any, res : any) {
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("endSession", req.body);

		res.end();
	}

	counter(req : any, res : any) {
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("counter", req.body);

		res.end();
	}

	postPic(req : any, res : any) {
		Logger.debug("Upload a picture locally");
		var self = this;
		var rootUpload =  __dirname + "/uploads/";

		fs.open(rootUpload, 'r', function (err, fd) {
			if (err) {
				fs.mkdirSync(rootUpload);
			}
		});

		fs.readFile(req.files.webcam.path, function (err, data) {

			var imageName = req.files.webcam.name;

			/// If there's an error
			if(!imageName){
				Logger.error("Error when uploading picture. Path : "+req.files.webcam.path);
				res.status(500).send({ error: 'Error when uploading picture' });
			} else {
				var newPath = rootUpload + imageName;
				var uploadedImages = [];

				fs.writeFile(newPath, data, function (err) {

					if (err) {
						Logger.error("Error when writing file : "+JSON.stringify(err));
						res.status(500).send({ error: 'Error when writing file'});
					} else {
						uploadedImages.push(newPath);

						var nameExt = self.getFileExtension(imageName);
						lwip.open(newPath, function (errOpen, image) {
							if (errOpen) {
								Logger.error("Error when opening file with lwip");
								res.status(500).send({ error: 'Error when writing file'});
							} else {

								Logger.debug("Open image with lwip, start to scale it.");
								image.resize(640, 360, function (errscale, imageScale) {
									var newName = rootUpload + nameExt[0]+ "_640."+nameExt[1];
									imageScale.writeFile(newName, function (errWrite) {
										if (errWrite) {
											Logger.error("Error when resizing image in 640px wide");
											res.status(500).send({ error: 'Error when writing file'});
										} else {
											uploadedImages.push(newName);
											Logger.debug("Resized image saved : "+newName);

											image.resize(320, 180, function (errscale, imageScale) {
												var newName = rootUpload + nameExt[0]+ "_320."+nameExt[1];
												imageScale.writeFile(newName, function (errWrite) {
													if (errWrite) {
														Logger.error("Error when resizing image in 320px wide");
														res.status(500).send({ error: 'Error when writing file'});
													} else {
														uploadedImages.push(newName);
														Logger.debug("Resized image saved : "+newName);
														res.status(200).send({message: "Upload ok", files: JSON.stringify(uploadedImages)});
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
		var indexLastDot = filename.lastIndexOf('.');

		res.push(filename.substring(0, indexLastDot));
		res.push(filename.substring(indexLastDot+1, filename.length));
		return res;
	}

	cloudinaryPic(req : any, res : any) {
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
			res.status(200).send({message: "Upload ok", files: JSON.stringify(uploadedImages)});
		}, {
			tags: ['photobox']
		});
	}
}