/*
* @author Simon Urli <simon@the6thscreen.fr>
*/

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />

var request = require('request');

class Subscribe extends SourceItf {
	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		Logger.debug("Retrieve subscribe with params:");
		Logger.debug(this.getParams());

		if (this.checkParams(["InfoDuration","CMSAlbumId","CounterDuration","Limit","AppliURL","LogoLeftURL","LogoRightURL"])) {
			photoboxNamespaceManager.setParams(params);
			this.run();
		}
	}

	private getIDLastPicture() : string {
	
	}

	public run() {
		var infoDuration = parseInt(this.getParams().InfoDuration);
		var socketId = this.getSourceNamespaceManager().socket.id;
		var appliUrl = this.getParams().AppliURL;
		var urlLastPic = null;

		if (arraylastPic.length > 0) {
			var lastPic : Picture = arraylastPic[0];
			urlLastPic = lastPic.getOriginal().getURL();
		}

		var cmd : Cmd = new Cmd(uuid.v1());
		cmd.setDurationToDisplay(infoDuration);
		cmd.setCmd("Wait");

		var args : Array<string> = new Array<string>();
		args.push(socketId);
		args.push(appliUrl);

		if (urlLastPic != null) {
			args.push(urlLastPic);
		}

		cmd.setArgs(args);

		var list : CmdList = new CmdList(uuid.v1());
		list.addCmd(cmd);

		this.getSourceNamespaceManager().sendNewInfoToClient(list);
	}
}