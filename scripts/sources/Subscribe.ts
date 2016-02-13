/*
* @author Simon Urli <simon@the6thscreen.fr>
*/

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />

class Subscribe extends SourceItf {

	private _album : PhotoboxAlbum;

	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		Logger.debug("Retrieve subscribe with params:");
		Logger.debug(this.getParams());

		if (this.checkParams(["InfoDuration","Tag","WatermarkURL","CounterDuration","Limit"])) {
			photoboxNamespaceManager.setParams(params);
			this._album = PhotoboxNamespaceManager.createTag(this.getParams().Tag);
			this.run();
		}
	}

	public run() {
		var arraylastPic = this._album.getLastPictures(1);

		var cmd : Cmd = new Cmd(uuid.v1());
		cmd.setDurationToDisplay(parseInt(this.getParams().InfoDuration));
		cmd.setCmd("Wait");
		var args : Array<string> = new Array<string>();
		args.push(this.getSourceNamespaceManager().socket.id);
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