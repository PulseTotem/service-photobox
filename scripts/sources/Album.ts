/*
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />
/// <reference path="../../t6s-core/core-backend/t6s-core/core/scripts/infotype/PictureAlbum.ts" />

class Album extends SourceItf {
	private _album : PhotoboxAlbum;

	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		Logger.debug("Retrieve albums with params:");
		Logger.debug(this.getParams());

		var cloudStorage : boolean = JSON.parse(this.getParams().CloudStorage);
		this._album = photoboxNamespaceManager.createTag(this.getParams().Tag, cloudStorage);
		this.run();
	}

	public run() {
		var self = this;

		var limit = parseInt(this.getParams().Limit);
		var pictures : Array<Picture> = this._album.getLastPictures(limit);
		var list : PictureAlbum = new PictureAlbum(uuid.v1());

		if (pictures.length > 0) {
			pictures.forEach( function (pic: Picture) {
				pic.setDurationToDisplay(self.getParams().InfoDuration);
				list.addPicture(pic);
			});

			this.getSourceNamespaceManager().sendNewInfoToClient(list);
		}
	}
}