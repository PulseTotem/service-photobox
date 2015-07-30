/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

var moment = require('moment');

class PhotoboxUtils {
	public static TIMEOUT_DURATION = 30;

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
		var indexLastDot = filename.lastIndexOf('.');

		res.push(filename.substring(indexLastSlash+1, indexLastDot));
		res.push(filename.substring(indexLastDot+1, filename.length));
		return res;
	}

	public static getDirectoryFromTag(tag : string) : string {
		return Photobox.upload_directory+"/"+tag+"/";
	}

	public static createImageName() : string {
		var stringDate = moment().format();

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

	public static configCloudinary() {
		cloudinary.config({
			cloud_name: 'pulsetotem',
			api_key: '961435335945823',
			api_secret: 'fBnekdGtXb8TOZs43dxIECvCX5c'
		});
	}
}