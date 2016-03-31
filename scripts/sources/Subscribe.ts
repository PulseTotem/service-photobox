/*
* @author Simon Urli <simon@the6thscreen.fr>
*/

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/RestClient.ts" />
/// <reference path="../core/ServiceConfig.ts" />

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

	private getIDLastPicture(callback : Function) {
		var url = ServiceConfig.getCMSHost()+"/admin/images_collections/"+this.getParams().CMSAlbumId+"/images";

		var fail = function (error) {
			Logger.error("Error while getting last picture from: "+url);
			callback(null);
		};

		var success = function (arrayImages : Array<any>) {
			if (arrayImages !== null && arrayImages.length > 0) {
				var lastImage : any = arrayImages.slice(-1);
				callback(lastImage.id);
			} else {
				Logger.debug("Obtained array for last picture: "+arrayImages);
				callback(null);
			}


		};

		RestClient.get(url, success, fail, ServiceConfig.getCMSAuthKey());
	}

	public run() {
		var self = this;
		var infoDuration = parseInt(this.getParams().InfoDuration);
		var socketId = this.getSourceNamespaceManager().socket.id;
		var appliUrl = this.getParams().AppliURL;

		var callbackLastpicture = function (idLastPic) {
			var cmd : Cmd = new Cmd(uuid.v1());
			cmd.setDurationToDisplay(infoDuration);
			cmd.setCmd("Wait");

			var args : Array<string> = new Array<string>();
			args.push(socketId);
			args.push(appliUrl);

			if (idLastPic != null) {
				var urlLastPic = PhotoboxUtils.getMediumUrlFromId(idLastPic);
				args.push(urlLastPic);
			};

			cmd.setArgs(args);

			var list : CmdList = new CmdList(uuid.v1());
			list.addCmd(cmd);

			self.getSourceNamespaceManager().sendNewInfoToClient(list);
		};

		this.getIDLastPicture(callbackLastpicture);
	}
}