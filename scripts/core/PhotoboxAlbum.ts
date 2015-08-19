/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../../t6s-core/core-backend/t6s-core/core/scripts/infotype/Picture.ts" />
/// <reference path="./PhotoboxUtils.ts" />

/**
 * Represent an album corresponding to a tag in Photobox.
 */
class PhotoboxAlbum {

	/**
	 * The tag of the album
	 *
	 * @property _tag
	 * @type {string}
	 * @private
	 */
	private _tag : string;

	/**
	 * The list of pictures of the album
	 *
	 * @property _pictures
	 * @type {Array<Picture>}
	 * @private
	 */
	private _pictures : Array<Picture>;

	constructor(tag : string, cloudStorage : boolean) {
		this._tag = tag;
		this._pictures = new Array<Picture>();

		if (cloudStorage) {
			this.retrievePicsFromCloud();
		} else {
			this.retrievePicsFromLocal();
		}
	}

	public getTag() {
		return this._tag;
	}

	public getPictures() {
		return this._pictures;
	}

	private retrievePicsFromCloud() {
		var self = this;
		PhotoboxUtils.configCloudinary();

		cloudinary.api.resources_by_tag(this._tag, function(result){
			result.resources.forEach(function(element) {
				var urls : Array<string> = new Array<string>();
				urls.push(element.url);

				var img_medium = cloudinary.url(element.public_id, { width: PhotoboxUtils.MIDDLE_SIZE.width, height: PhotoboxUtils.MIDDLE_SIZE.height, crop: 'scale' } );
				urls.push(img_medium);

				var img_small = cloudinary.url(element.public_id, { width: PhotoboxUtils.SMALL_SIZE.width, height: PhotoboxUtils.SMALL_SIZE.height, crop: 'scale' } );
				urls.push(img_small);
				self.addPicture(urls);
			});
		});
	}

	public retrievePicsFromLocal() {

		this._pictures = new Array<Picture>();
		var self = this;
		fs.readdir(PhotoboxUtils.getDirectoryFromTag(this._tag), function (err, files) {
			if (err) {
				Logger.error("Error when reading the directory. "+err);
			} else {
				Logger.debug("Start scanning directory : "+PhotoboxUtils.getDirectoryFromTag(this._tag));
				files.forEach(function (file) {
					if (file.indexOf(PhotoboxUtils.MIDDLE_SIZE.identifier) == -1 && file.indexOf(PhotoboxUtils.SMALL_SIZE.identifier) == -1) {
						var urls : Array<string> = new Array<string>();
						var fileext = PhotoboxUtils.getFileExtension(file);
						var basename = PhotoboxUtils.getBaseURL(self._tag)+file.substr(0, file.length - fileext[1].length - 1);

						urls.push(basename+"."+fileext[1]);

						urls.push(basename+PhotoboxUtils.MIDDLE_SIZE.identifier+"."+fileext[1]);
						urls.push(basename+PhotoboxUtils.SMALL_SIZE.identifier+"."+fileext[1]);

						self.addPicture(urls);
					}
				});
			}
		});
	}

	public addPicture(urls: Array<string>) {
		var original = urls[0];
		var medium = urls[1];
		var small = urls[2];

		var nameOriginal = PhotoboxUtils.getFileExtension(original)[0];
		var nameMedium = PhotoboxUtils.getFileExtension(medium)[0];
		var nameSmall = PhotoboxUtils.getFileExtension(small)[0];

		var pic : Picture = new Picture(nameOriginal);
		pic.setTitle("Photobox #"+this._tag);

		var picUrlOriginal : PictureURL = new PictureURL(nameOriginal);
		picUrlOriginal.setURL(original);
		pic.setOriginal(picUrlOriginal);

		var picUrlMedium : PictureURL = new PictureURL(nameMedium);
		picUrlMedium.setURL(medium);
		picUrlMedium.setWidth(PhotoboxUtils.MIDDLE_SIZE.width);
		picUrlMedium.setHeight(PhotoboxUtils.MIDDLE_SIZE.height);
		pic.setMedium(picUrlMedium);

		var picUrlSmall : PictureURL = new PictureURL(nameSmall);
		picUrlSmall.setURL(small);
		picUrlSmall.setWidth(PhotoboxUtils.SMALL_SIZE.width);
		picUrlSmall.setHeight(PhotoboxUtils.SMALL_SIZE.height);
		pic.setSmall(picUrlSmall);

		this._pictures.push(pic);
	}

	public getLastPictures(limit : number): Array<Picture> {
		return this._pictures.slice(-limit);
	}
}