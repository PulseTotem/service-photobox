/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceNamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/CmdList.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/Cmd.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/priorities/InfoPriority.ts" />

class PhotoboxNamespaceManager extends SourceNamespaceManager {

	private _params : any;

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket : any) {
		super(socket);
		this.addListenerToSocket('Subscribe', function (params, photoboxNamespaceManager) { new Subscribe(params, photoboxNamespaceManager); });

		this._params = null;
	}

	public setParams(params : any) {
		this._params = params;
	}

	/**
	 * Method called when external message come (from API Endpoints for example).
	 *
	 * @method onExternalMessage
	 * @param {string} from - Source description of message
	 * @param {any} message - Received message
	 */
	onExternalMessage(from : string, message : any) {
		if (from == "startSession") {
			this.startSession(message);
		} else if (from == "counter") {
			this.startCounter(message);
		} else if (from == "endSession") {
			this.endSession(message);
		}
	}

	private startSession(message : any) {
		var cmdList:CmdList = new CmdList(uuid.v1());
		var cmd:Cmd = new Cmd(message.params.sessionid);
		cmd.setCmd("startSession");
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setDurationToDisplay(30000);
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}

	private startCounter(message : any) {
		var cmd:Cmd = new Cmd(message.params.sessionid);
		
		cmd.setDurationToDisplay(30000);
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setCmd("counter");

		var args : Array<string> = new Array();
		args.push(this._params.CounterDuration);

		var cloudStorage = JSON.parse(this._params.CloudStorage);
		var postUrl = "http://"+message.headers.host+"/rest/post/"+cmd.getId().toString()+"/"+cloudStorage.toString();

		args.push(postUrl);
		cmd.setArgs(args);


		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}

	private endSession(message : any) {
		var cmd:Cmd = new Cmd(message.params.sessionid);

		cmd.setDurationToDisplay(1);
		cmd.setCmd("validatedPicture");
		cmd.setPriority(InfoPriority.HIGH);

		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}
}