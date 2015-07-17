/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

class PhotoboxUtils {
	public static ROOT_UPLOAD = "uploads";

	public static getFileExtension(filename : string) : Array<string> {
		var res = [];
		var indexLastSlash = filename.lastIndexOf('/');
		var indexLastDot = filename.lastIndexOf('.');

		res.push(filename.substring(indexLastSlash+1, indexLastDot));
		res.push(filename.substring(indexLastDot+1, filename.length));
		return res;
	}
}