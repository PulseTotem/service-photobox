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

	/**
	 * The list of blacklisted pictures: those pictures won't be retrieved to be displayed.
	 *
	 * @property _blacklistedPictures
	 * @type {Array<string>}
	 * @private
	 */
	private _blacklistedPictures : Array<string>;

	constructor(tag : string) {
		this._tag = tag;
		this._pictures = new Array<Picture>();
		this._blacklistedPictures = new Array<string>();

		this.readBlacklistFile();
		this.retrievePicsFromLocal();
	}

	public getTag() {
		return this._tag;
	}

	public getPictures() {
		return this._pictures;
	}

	private readBlacklistFile() {
		var content = "";
		try {
			content = fs.readFileSync(PhotoboxUtils.getDirectoryFromTag(this._tag)+PhotoboxUtils.BLACKLIST_FILE, {"encoding":"utf8"});
			this._blacklistedPictures = content.split("\n");
		} catch (err) {
			Logger.debug("Unable to read blacklist file (location: "+PhotoboxUtils.getDirectoryFromTag(this._tag)+PhotoboxUtils.BLACKLIST_FILE+"). Perhaps it does not exist yet. Error: "+JSON.stringify(err));
		}
	}

	public retrievePicsFromLocal() {
		this._pictures = new Array<Picture>();
		var self = this;
		fs.readdir(PhotoboxUtils.getDirectoryFromTag(this._tag), function (err, files) {
			if (err) {
				Logger.error("Error when reading the directory. "+err);
			} else {
				Logger.debug("Start scanning directory : "+PhotoboxUtils.getDirectoryFromTag(self._tag));
				files.forEach(function (file) {
					if (file.indexOf(PhotoboxUtils.MIDDLE_SIZE.identifier) == -1 && file.indexOf(PhotoboxUtils.SMALL_SIZE.identifier) == -1) {
						var fileext = PhotoboxUtils.getFileExtension(file);
						var basename = PhotoboxUtils.getBaseURL(self._tag)+file.substr(0, file.length - fileext[1].length - 1);

						var fileId = fileext[0];
						var completeMediumPath = fileId+PhotoboxUtils.MIDDLE_SIZE.identifier+"."+fileext[1];
						var completeSmallPath = fileId+PhotoboxUtils.SMALL_SIZE.identifier+"."+fileext[1];

						if (self._blacklistedPictures.indexOf(fileId) == -1 && files.indexOf(completeMediumPath) != -1 && files.indexOf(completeSmallPath) != -1) {
							var originalPath = file;
							var picture : PhotoboxPicture = new PhotoboxPicture(this._tag, originalPath);
							picture.setMediumPicture(completeMediumPath);
							picture.setSmallPicture(completeSmallPath);

							self.addPicture(picture);
						} else {
							Logger.debug("Following file is blacklisted or does not match picture pattern: "+file);
						}
					}
				});
			}
		});
	}

	public addPicture(picture : PhotoboxPicture) {
		var original = picture.getURLOriginalPicture();
		var medium = picture.getURLMediumPicture();
		var small = picture.getURLSmallPicture();

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

	public deletePicture(photoID : string) {
		Logger.debug("Call deletePicture for photoID: "+photoID);
		var index = -1;
		for (var i = 0; i < this._pictures.length; i++) {
			var pic : Picture = this._pictures[i];

			if (PhotoboxUtils.getFileExtension(pic.getId())[0] == photoID) {
				index = i;
			}
		}

		if (index != -1) {
			Logger.debug("Blacklist the following picture: "+photoID);
			var content = photoID+"\n";
			fs.appendFileSync(PhotoboxUtils.getDirectoryFromTag(this._tag)+PhotoboxUtils.BLACKLIST_FILE, content);
			this._blacklistedPictures.push(photoID);

			this._pictures.splice(index, 1);

		}
	}

	public getLastPictures(limit : number): Array<Picture> {
		return this._pictures.slice(-limit);
	}
}