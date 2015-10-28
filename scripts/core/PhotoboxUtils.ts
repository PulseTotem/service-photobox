/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../Photobox.ts" />

var moment = require('moment');
var request = require('request');

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
		return "http://"+Photobox.host+"/"+Photobox.serving_upload_dir+"/";
	}

	public static getBaseURL(tag : string) : string {
		return PhotoboxUtils.getCompleteHostname()+tag+"/";
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
}