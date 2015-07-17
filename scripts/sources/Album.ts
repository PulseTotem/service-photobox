/*
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />
/// <reference path="../../t6s-core/core-backend/t6s-core/core/scripts/infotype/PictureAlbum.ts" />

class Album extends SourceItf {
	private _album : PhotoboxAlbum;

	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		photoboxNamespaceManager.setParams(params);

		var cloudStorage : boolean = JSON.parse(this.getParams().CloudStorage);
		this._album = photoboxNamespaceManager.createTag(this.getParams().Tag, cloudStorage);
	}

	public run() {
		var self = this;

		Logger.debug("listenNotifications Action with params :");
		Logger.debug(this.getParams());

		var limit = parseInt(this.getParams().Limit);
		var pictures : Array<Picture> = this._album.getLastPictures(limit);
		var list : PictureAlbum = new PictureAlbum(uuid.v1());

		pictures.forEach( function (pic: Picture) {
			pic.setDurationToDisplay(this.getParams().InfoDuration);
			list.addPicture(pic);
		});

		this.getSourceNamespaceManager().sendNewInfoToClient(list);
	}
}