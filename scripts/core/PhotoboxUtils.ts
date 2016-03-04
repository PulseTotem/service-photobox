/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../Photobox.ts" />

var moment = require('moment');
var request = require('request');
var lwip = require('lwip');
var mime = require('mime-sniffer');

class PhotoboxUtils {
	public static TIMEOUT_DURATION = 30;
	public static BLACKLIST_FILE = "blacklist.txt";

	public static MIDDLE_SIZE = {
		identifier: "_medium",
		width: 640,
		height: 360
	};

	public static SMALL_SIZE = {
		identifier: "_small",
		width: 320,
		height: 180
	};

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

	public static getDirectoryFromTag(tag : string) : string {
		return Photobox.upload_directory+"/"+tag+"/";
	}

	public static createImageName() : string {
		var stringDate = moment().format("YYYYMMDDHHmmss");

		return stringDate;
	}

	public static getCompleteHostname() : string {
		return "https://"+Photobox.host+"/"+Photobox.serving_upload_dir+"/";
	}

	public static getBaseURL(tag : string) : string {
		return PhotoboxUtils.getCompleteHostname()+tag+"/";
	}

	public static getURLFromPath(path : string, tag : string) {
		var splitname = PhotoboxUtils.getFileExtension(path);
		return PhotoboxUtils.getBaseURL(tag)+splitname[0]+"."+splitname[1];
	}

	public static getNewImageNamesFromOriginalImage(imageName : string) : Array<string> {
		var result : Array<string> = new Array<string>();

		var basename = PhotoboxUtils.createImageName();
		var extension = PhotoboxUtils.getFileExtension(imageName);

		result.push(basename+"."+extension[1]);
		result.push(basename+PhotoboxUtils.MIDDLE_SIZE.identifier+"."+extension[1]);
		result.push(basename+PhotoboxUtils.SMALL_SIZE.identifier+"."+extension[1]);

		return result;
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
					image.batch().paste()
				}
			};
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
												var newLogoLeftWidth : number = Math.round((logoLeft.height()*logoLeft.width()) / height);

												var newLogoRightHeight : number = height;
												var newLogoRightWidth : number = Math.round((logoRight.height()*logoRight.width()) / height);

												if ((newLogoLeftWidth + newLogoRightWidth) > (width-50)) {
													var maxSize = (width-50)/2;
													if (newLogoLeftWidth > maxSize) {
														newLogoLeftWidth = maxSize;
														newLogoLeftHeight = Math.round((logoLeft.width()*logoLeft.height())/maxSize);
													}
													if (newLogoRightWidth > maxSize) {
														newLogoRightWidth = maxSize;
														newLogoRightHeight = Math.round((logoRight.width()*logoRight.height())/maxSize);
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

		PhotoboxUtils.downloadFile(logoLeftUrl, localLogoLeft, successDownloadLogo, failCallback);
		PhotoboxUtils.downloadFile(logoRightUrl, localLogoRight, successDownloadLogo, failCallback);
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
	public static postAndApplyWatermark(image : any, imageName : string, tag : string, logoLeft: string, logoRight: string, callback : Function) {
		// TODO : check pattern... (cf CMS)
		var base64DrawContent = image.replace(/^data:image\/jpeg;base64,/, "");
		var drawContentImg = new Buffer(base64DrawContent, 'base64');

		var newPathes = PhotoboxUtils.getNewImageNamesFromOriginalImage(imageName);

		var originalPath = PhotoboxUtils.getDirectoryFromTag(tag)+newPathes[0];
		var smallSizePath = PhotoboxUtils.getDirectoryFromTag(tag)+newPathes[1];
		var mediumSizePath = PhotoboxUtils.getDirectoryFromTag(tag)+newPathes[2];

		var photoboxPicture : PhotoboxPicture = null;

		var fail = function (msg) {
			callback(false, "Error when posting the picture. Error: "+msg);
		};

		lwip.open(drawContentImg, 'jpg', function (drawContentErr, image) {
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
											var callbackResizeImgMedium = function (errScaleMedium, imgScaledMedium) {
												if (errScaleMedium) {
													fail("Fail resizing to medium image with lwip : "+JSON.stringify(errScaleMedium));
												} else {
													var callbackWriteResizedMedium = function (errWriteResizedMedium) {
														if (errWriteResizedMedium) {
															fail("Fail writing medium image with lwip : "+JSON.stringify(errWriteResizedMedium));
														} else {

															var callbackResizeImgSmall = function (errScaleSmall, imgScaledSmall) {
																if (errScaleSmall) {
																	fail("Fail resizing to small image with lwip : "+JSON.stringify(errScaleSmall));
																} else {
																	var callbackWriteResizedSmall = function (errWriteResizedSmall) {
																		if (errWriteResizedSmall) {
																			fail("Fail writing small image with lwip : "+JSON.stringify(errWriteResizedSmall));
																		} else {
																			photoboxPicture.setSmallPicture(smallSizePath);
																			callback(true, photoboxPicture);
																		}
																	};

																	imgScaledSmall.writeFile(smallSizePath, callbackWriteResizedSmall);
																}
															};
															photoboxPicture.setMediumPicture(mediumSizePath);
															imgWatermarked.resize(PhotoboxUtils.SMALL_SIZE.width, PhotoboxUtils.SMALL_SIZE.height, callbackResizeImgSmall);
														}
													};

													imgScaledMedium.writeFile(mediumSizePath, callbackWriteResizedMedium);
												}
											};

											photoboxPicture = new PhotoboxPicture(tag, originalPath);
											imgWatermarked.resize(PhotoboxUtils.MIDDLE_SIZE.width, PhotoboxUtils.MIDDLE_SIZE.height, callbackResizeImgMedium);
										}
									};

									imgWatermarked.writeFile(originalPath, callbackWriteOriginalFile);
								}
							};

							image.paste(0, (image.height()-img_watermark.height()), img_watermark, callbackPasteWatermark);
						}
					});
				};

				var watermark_width = image.width();
				var watermark_height = (image.height() * 10) / 100;
				PhotoboxUtils.createWatermark(watermark_width, watermark_height, logoLeft, logoRight, successCreateWatermark, fail);
			}
		});
	}
}