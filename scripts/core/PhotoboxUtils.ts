/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../Photobox.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/RestClient.ts" />

var moment = require('moment');
var request = require('request');
var lwip = require('lwip');
var mime = require('mime-sniffer');
var fs : any = require('fs');

class PhotoboxUtils {
	public static TIMEOUT_DURATION = 30;

	public static getFileExtension(filename : string) : Array<string> {
		var res = [];
		var indexLastSlash = filename.lastIndexOf('/');


		var file = filename.substring(indexLastSlash+1);
		var indexLastDot = file.lastIndexOf('.');

		if (indexLastDot != -1) {
			res.push(file.substring(0, indexLastDot));
			res.push(file.substring(indexLastDot+1, file.length));
		} else {
			res.push(file);
			res.push("");
		}

		return res;
	}

	public static createImageName() : string {
		var stringDate = moment().format("YYYYMMDDHHmmss");

		return stringDate;
	}

	public static getCompleteHostname() : string {
		return "https://"+Photobox.host+"/"+Photobox.serving_upload_dir+"/";
	}

	public static getNewImageNamesFromOriginalImage(imageName : string) : string {
		var basename = PhotoboxUtils.createImageName();
		var extension = PhotoboxUtils.getFileExtension(imageName);

		return basename+"."+extension[1];
	}

	public static downloadFile(url, localpath, callbackSuccess, callbackError) {
		request.head(url, function(err, res, body){
			if (err) {
				callbackError(err);
			} else {
				request(url).pipe(fs.createWriteStream(localpath)).on('close', callbackSuccess);
			}
		});
	}

	public static createWatermark(width : number, height : number, logoLeftUrl : string, logoRightUrl : string, successCallback: Function, failCallback: Function) {
		var uniqueWatermarkId = uuid.v1();
		var localLogoLeft = "/tmp/"+uniqueWatermarkId+"_left";
		var localLogoRight = "/tmp/"+uniqueWatermarkId+"_right";
		var pathWatermark = "/tmp/"+uniqueWatermarkId+".png";
		var leftExtension;
		var rightExtension;

		var counterDownload = 0;

		var successResizingLogos = function () {
			var successCreateImage = function (errCreateImage, image) {
				if (errCreateImage) {
					failCallback("Error when creating watermark image: "+JSON.stringify(errCreateImage));
				} else {
					lwip.open(localLogoLeft, leftExtension, function (errOpenLogoLeft, newLogoLeft) {
						if (errOpenLogoLeft) {
							failCallback("Error when opening new logo left to paste it : "+JSON.stringify(errOpenLogoLeft));
						} else {
							lwip.open(localLogoRight, rightExtension, function (errOpenLogoRight, newLogoRight) {
								if (errOpenLogoRight) {
									failCallback("Error when opening new logo right to paste it : "+JSON.stringify(errOpenLogoRight));
								} else {
									var logoLeftLeft : number = 10; //10px from border left;
									var logoLeftTop : number = Math.round((image.height() - newLogoLeft.height())/2);

									var logoRightLeft : number = image.width() - newLogoRight.width() - 10;
									var logoRightTop : number = Math.round((image.height() - newLogoRight.height()) /2);

									Logger.debug("Position of left logo: left: "+logoLeftLeft+" | top: "+logoLeftTop);
									Logger.debug("Position of right logo: left: "+logoRightLeft+" | top: "+logoRightTop);
									image.batch()
										.paste(logoLeftLeft, logoLeftTop, newLogoLeft)
										.paste(logoRightLeft, logoRightTop, newLogoRight)
										.writeFile(pathWatermark, function (errPasteWrite) {
											if (errPasteWrite) {
												failCallback("Error when pasting logos or writing final file: "+JSON.stringify(errPasteWrite));
											} else {
												fs.unlinkSync(localLogoLeft);
												fs.unlinkSync(localLogoRight);
												successCallback(pathWatermark);
											}
										});
								}
							});
						}
					});
				}
			};
			Logger.debug("Create image with following dimension: W: "+width+" | H: "+height);
			lwip.create(width, height, {r: 255, g: 255, b: 255, a: 70}, successCreateImage);
		};

		var successDownloadLogo = function() {
			counterDownload++;
			if (counterDownload == 2) {
				mime.lookup(localLogoLeft, function(errSniffMimeLogoLeft, infoLogoLeft: any) {
					if (errSniffMimeLogoLeft) {
						failCallback("Error when detecting mimetype of logo left: "+JSON.stringify(errSniffMimeLogoLeft));
					} else {
						leftExtension = infoLogoLeft.extension;
						mime.lookup(localLogoRight, function (errSniffMimeLogoRight, infoLogoRight : any) {
							if (errSniffMimeLogoRight) {
								failCallback("Error when detecting mimetype of logo right: "+JSON.stringify(errSniffMimeLogoRight));
							} else {
								rightExtension = infoLogoRight.extension;
								lwip.open(localLogoLeft, leftExtension, function (errOpenLogoLeft, logoLeft) {
									if (errOpenLogoLeft) {
										failCallback("Error when opening left logo: "+JSON.stringify(errOpenLogoLeft));
									} else {
										lwip.open(localLogoRight, rightExtension, function (errOpenLogoRight, logoRight) {
											if (errOpenLogoRight) {
												failCallback("Error when opening right logo: "+JSON.stringify(errOpenLogoRight));
											} else {
												var newLogoLeftHeight : number = height;
												var newLogoLeftWidth : number = Math.round((newLogoLeftHeight*logoLeft.width()) / logoLeft.height());

												Logger.debug("Compute new dimension for logo left: H:"+newLogoLeftHeight+" | W:"+newLogoLeftWidth);

												var newLogoRightHeight : number = height;
												var newLogoRightWidth : number = Math.round((newLogoRightHeight*logoRight.width()) / logoRight.height());

												Logger.debug("Compute new dimension for logo right: H:"+newLogoRightHeight+" | W:"+newLogoRightWidth);

												if ((newLogoLeftWidth + newLogoRightWidth) > (width-50)) {
													var maxSize = (width-50)/2;

													Logger.debug("Sum of logo width is higher than image width + 50px. Max width: "+maxSize);

													if (newLogoLeftWidth > maxSize) {
														newLogoLeftWidth = maxSize;
														newLogoLeftHeight = Math.round((newLogoLeftWidth*logoLeft.height())/logoLeft.width());

														Logger.debug("Compute new logo left dimension: H:"+newLogoLeftHeight+"| W:"+newLogoLeftWidth);
													}


													if (newLogoRightWidth > maxSize) {
														newLogoRightWidth = maxSize;
														newLogoRightHeight = Math.round((newLogoRightWidth*logoRight.height())/logoRight.width());
														Logger.debug("Compute new logo right dimension: H:"+newLogoRightHeight+"| W:"+newLogoRightWidth);
													}
												}

												logoLeft.batch().resize(newLogoLeftWidth, newLogoLeftHeight)
													.writeFile(localLogoLeft, leftExtension, function (errWriteLogoLeft) {
														if (errWriteLogoLeft) {
															failCallback("Error when resizing logo left: "+JSON.stringify(errWriteLogoLeft));
														} else {
															logoRight.batch().resize(newLogoRightWidth, newLogoRightHeight)
																.writeFile(localLogoRight, rightExtension, function (errWriteLogoRight) {
																	if (errWriteLogoRight) {
																		failCallback("Error when resizing logo right: "+JSON.stringify(errWriteLogoRight));
																	} else {
																		successResizingLogos();
																	}
																});
														}
													});
											};
										})
									}
								});
							}
						});
					}
				});
			}
		};
		Logger.debug("Download logo files...");
		PhotoboxUtils.downloadFile(logoLeftUrl, localLogoLeft, successDownloadLogo, failCallback);
		PhotoboxUtils.downloadFile(logoRightUrl, localLogoRight, successDownloadLogo, failCallback);
	}

	private static guessImageExtensionFromB64(data) {
		if (data.indexOf("data:image/png") !== -1) {
			return "png"
		} else if (data.indexOf("data:image/jpeg") !== -1) {
			return "jpg";
		} else if (data.indexOf("data:image/gif") !== -1) {
			return "gif";
		} else {
			return null;
		}
	}

	/**
	 * Write a picture given in base64 format and write it to a specified directory after applying a watermark and creating small and medium pictures.
	 *
	 * @param image A base64 image to write and manipulate
	 * @param imageName The name of the image (only used to retrieve extension)
	 * @param watermarkUrl Url of the watermark to apply
	 * @param uploadDir Local directory where the image should be written
	 * @param bottomWatermark Determine if the watermark should be placed at the bottom or at the top of the image
	 * @param callback The callback in case of success or failure, it takes a boolean for success/failure and a message or an object containing the different images pathes.
	 */
	public static postAndApplyWatermark(image : any, imageName : string, cmsAlbumId : string, logoLeft: string, logoRight: string, callback : Function) {
		var fail = function (msg) {
			callback(false, "Error when posting the picture. Error: "+msg);
		};

		var extension = PhotoboxUtils.guessImageExtensionFromB64(image);

		if (extension == null) {
			fail("Unable to recognize file extension.");
		}

		var base64DrawContent = image.replace(/^data:image\/(jpeg|png|gif);base64,/, "");
		var drawContentImg = new Buffer(base64DrawContent, 'base64');

		var newImagename = PhotoboxUtils.getNewImageNamesFromOriginalImage(imageName);
		var newPath = "/tmp/"+uuid.v1()+newImagename;


		var photoboxPicture : PhotoboxPicture = null;

		Logger.debug("Open image with extension "+extension+" to the following path: "+newPath);
		lwip.open(drawContentImg, extension, function (drawContentErr, image) {
			if (drawContentErr) {
				fail("Fail opening original file : "+JSON.stringify(drawContentErr));
			} else {
				var successCreateWatermark = function (local_watermark) {
					lwip.open(local_watermark, function (errOpen, img_watermark) {
						if (errOpen) {
							fail("Fail opening watermark file : "+JSON.stringify(errOpen));
						} else {
							var callbackPasteWatermark = function (errPaste, imgWatermarked) {
								if (errPaste) {
									fail("Fail pasting watermark with lwip : "+JSON.stringify(errPaste));
								} else {
									var callbackWriteOriginalFile = function (errWriteOriginal) {
										if (errWriteOriginal) {
											fail("Fail writing original image with lwip : "+JSON.stringify(errWriteOriginal));
										} else {
											fs.unlinkSync(local_watermark);

											var successPostPicture = function (hashid : string) {
												photoboxPicture = new PhotoboxPicture(hashid);
												callback(true, photoboxPicture);
											};

											var description = "Picture taken "+moment().format('LLLL');
											PhotoboxUtils.postPictureToCMS(newPath, newImagename, description, cmsAlbumId, successPostPicture, fail);
										}
									};

									imgWatermarked.writeFile(newPath, callbackWriteOriginalFile);
								}
							};

							image.paste(0, (image.height()-img_watermark.height()), img_watermark, callbackPasteWatermark);
						}
					});
				};
				Logger.debug("Opening success. Launch watermark creation.");
				var watermark_width = image.width();
				var watermark_height = (image.height() * 10) / 100;
				PhotoboxUtils.createWatermark(watermark_width, watermark_height, logoLeft, logoRight, successCreateWatermark, fail);
			}
		});
	}

	private static base64_encode(file) {
		// read binary data
		var bitmap = fs.readFileSync(file);
		// convert binary data to base64 encoded string
		return new Buffer(bitmap).toString('base64');
	}

	private static postPictureToCMS(imagePath : string, imageName : string, description : string, cmsAlbumId : string, successCallback : Function, failCallback : Function) {
		var postPhotoUrl = ServiceConfig.getCMSHost() + "admin/images_collections/"+cmsAlbumId+"/images/";

		var b64datas = PhotoboxUtils.base64_encode(imagePath);

		var imageDatas = {
			'name': imageName,
			'description': description,
			'file': b64datas
		};

		var successPostPicture = function (imageObject : any) {
			fs.unlinkSync(imagePath);
			Logger.debug("Obtained picture info: "+imageObject);
			successCallback(imageObject.id);
		};

		Logger.debug("Post picture "+imagePath+" to "+postPhotoUrl);
		RestClient.post(postPhotoUrl, imageDatas, successPostPicture, failCallback, ServiceConfig.getCMSAuthKey());
	}

	public static getMediumUrlFromId(id : string) {
		return ServiceConfig.getCMSHost() + "images/" + id + "/raw?size=medium";
	}

	public static getOriginalUrlFromId(id: string) {
		return ServiceConfig.getCMSHost() + "images/" + id + "/raw?size=original"
	}
}