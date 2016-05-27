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

		if (this.checkParams(["InfoDuration","CMSAlbumId","CounterDuration","Limit","AppliURL","LogoLeftURL"])) {
			photoboxNamespaceManager.setParams(params);
			this.run();
		}
	}

	private getIDLastPicture(callback : Function) {
		var url = ServiceConfig.getCMSHost()+"admin/images_collections/"+this.getParams().CMSAlbumId+"/images";

		var fail = function (error : RestClientResponse) {
			Logger.error("Error while getting last picture from: "+url);
			Logger.error(error.data());
			callback(null);
		};

		var success = function (response : RestClientResponse) {
			var arrayImages : Array<any> = response.data();
			if (arrayImages !== null && arrayImages.length > 0) {
				var lastImage : any = arrayImages.slice(-1)[0];
				Logger.debug("Last image obtained: ");
				Logger.debug(lastImage);
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
		var messages = this.getParams().Messages;

		var callbackLastpicture = function (idLastPic) {
			var cmd : Cmd = new Cmd(self.getParams().CMSAlbumId);
			cmd.setDurationToDisplay(infoDuration);
			cmd.setCmd("Wait");

			var args : Array<string> = new Array<string>();
			args.push(socketId);
			args.push(appliUrl);
			args.push(messages);

			if (idLastPic !== null) {
				var urlLastPic = PhotoboxUtils.getMediumUrlFromId(idLastPic);
				Logger.debug("URL Last picture :");
				Logger.debug(urlLastPic);
				args.push(urlLastPic);
			} else {
				Logger.debug("IdLastPic:"+idLastPic);
			}

			cmd.setArgs(args);

			var list : CmdList = new CmdList(uuid.v1());
			list.addCmd(cmd);

			self.getSourceNamespaceManager().sendNewInfoToClient(list);
		};

		this.getIDLastPicture(callbackLastpicture);
	}
}