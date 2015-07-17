/*
* @author Simon Urli <simon@the6thscreen.fr>
*/

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />

class Subscribe extends SourceItf {

	private _album : PhotoboxAlbum;

	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		photoboxNamespaceManager.setParams(params);
		var cloudStorage : boolean = JSON.parse(this.getParams().CloudStorage);
		this._album = photoboxNamespaceManager.createTag(this.getParams().Tag, cloudStorage);
	}

	public run() {
		Logger.debug("listenNotifications Action with params :");
		Logger.debug(this.getParams());

		var arraylastPic = this._album.getLastPictures(1);

		var cmd : Cmd = new Cmd("WaitMessage");
		cmd.setDurationToDisplay(this.getParams().InfoDuration);
		cmd.setCmd("Wait");
		var args : Array<string> = new Array<string>();
		args.push(this.getParams().URL);

		if (arraylastPic.length > 0) {
			var lastPic : Picture = arraylastPic[0];
			var urlLastPic = lastPic.getOriginal().getURL();
			args.push(urlLastPic);
		}
		cmd.setArgs(args);

		var list : CmdList = new CmdList(uuid.v1());
		list.addCmd(cmd);

		this.getSourceNamespaceManager().sendNewInfoToClient(list);
	}
}