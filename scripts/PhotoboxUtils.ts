/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

class PhotoboxUtils {
	public static ROOT_UPLOAD = "uploads";

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
		return PhotoboxUtils.ROOT_UPLOAD+"/"+tag;
	}

	public static createImageName(tag : string) : string {
		var now = new Date();
		var stringDate = now.getDate().toString()+now.getTime().toString();

		return PhotoboxUtils.getDirectoryFromTag(tag)+"/"+stringDate;
	}
}