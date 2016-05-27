/*
* @author Simon Urli <simon@the6thscreen.fr>
*/

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />
/// <reference path="../../t6s-core/core-backend/scripts/RestClient.ts" />
/// <reference path="../core/ServiceConfig.ts" />

class SubscribeOneClick extends SourceItf {
	private _isManagerInitialized : boolean;

	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		Logger.debug("Retrieve subscribe with params:");
		Logger.debug(this.getParams());
		this._isManagerInitialized = photoboxNamespaceManager.isClientInitialized();

		if (this.checkParams(["InfoDuration","CMSAlbumId","CounterDuration","Limit","LogoLeftURL"])) {
			photoboxNamespaceManager.setParams(params);
			this.run();
		}
	}

	public run() {
		var self = this;
		var infoDuration = parseInt(this.getParams().InfoDuration);
		var counterDuration = this.getParams().CounterDuration;
		var messages = this.getParams().Messages;

		var cmd : Cmd = new Cmd(self.getParams().CMSAlbumId);
		cmd.setDurationToDisplay(infoDuration);
		cmd.setCmd("WaitOneClick");
		cmd.pushArg(counterDuration);
		cmd.pushArg(messages);

		var list : CmdList = new CmdList(uuid.v1());
		list.addCmd(cmd);

		if (!this._isManagerInitialized) {
			self.getSourceNamespaceManager().sendNewInfoToClient(list);
		}
	}
}