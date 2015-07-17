/*
* @author Simon Urli <simon@the6thscreen.fr>
*/

/// <reference path="../../t6s-core/core-backend/scripts/server/SourceItf.ts" />

class Subscribe extends SourceItf {

	constructor(params : any, photoboxNamespaceManager : PhotoboxNamespaceManager) {
		super(params, photoboxNamespaceManager);
		photoboxNamespaceManager.setParams(params);
	}

	public run() {
		Logger.debug("listenNotifications Action with params :");
		Logger.debug(this.getParams());

		var cmd : Cmd = new Cmd("WaitMessage");
		cmd.setDurationToDisplay(this.getParams().InfoDuration);
		cmd.setCmd("Wait");
		var args : Array<string> = new Array<string>();
		args.push(this.getParams().URL);
		cmd.setArgs(args);

		var list : CmdList = new CmdList(uuid.v1());
		list.addCmd(cmd);

		this.getSourceNamespaceManager().sendNewInfoToClient(list);
	}
}