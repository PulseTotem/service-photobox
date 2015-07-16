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
	private _cmdSession : Cmd;

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket : any) {
		super(socket);
		this.addListenerToSocket('Subscribe', this.subscribe);

		this._params = null;
		this._cmdSession = null;
	}

	/**
	 * Subscribe to notifications.
	 *
	 * @method subscribe
	 * @param {Object} params - Params to subscribe to notifications : ???.
	 * @param {NotifierNamespaceManager} self - the NotifierNamespaceManager's instance.
	 */
	subscribe(params : any, self : PhotoboxNamespaceManager = null) {
		if(self == null) {
			self = this;
		}

		Logger.debug("listenNotifications Action with params :");
		Logger.debug(params);
		self._params = params;
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
		var cmd:Cmd = new Cmd(uuid.v1());
		cmd.setCmd("startSession");
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setDurationToDisplay(30000);
		cmdList.addCmd(cmd);
		this._cmdSession = cmd;

		this.sendNewInfoToClient(cmdList);
	}

	private startCounter(message : any) {
		if (this._cmdSession == null) {
			Logger.debug("Create a new CmdSession");
			this._cmdSession = new Cmd(uuid.v1());
		}

		this._cmdSession.setDurationToDisplay(30000);
		this._cmdSession.setPriority(InfoPriority.HIGH);
		this._cmdSession.setCmd("counter");

		var args : Array<string> = new Array();
		args.push(this._params.InfoDuration);

		var cloudStorage = JSON.parse(this._params.CloudStorage);
		var postUrl = "http://"+message.headers.host+"/rest/post/";
		if (cloudStorage) {
			postUrl += "cloud";
		} else {
			postUrl += "local";
		}

		args.push(postUrl);
		this._cmdSession.setArgs(args);


		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(this._cmdSession);

		this.sendNewInfoToClient(cmdList);
	}

	private endSession(message : any) {
		this._cmdSession.setDurationToDisplay(1);
		this._cmdSession.setCmd("validatedPicture");
		this._cmdSession.setPriority(InfoPriority.HIGH);

		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(this._cmdSession);

		this.sendNewInfoToClient(cmdList);
	}
}