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
		this.addListenerToSocket('subscribe', this.subscribe);
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
			var cmdList : CmdList = new CmdList(uuid.v1());
			var cmd : Cmd = new Cmd(uuid.v1());
			cmd.setCmd("startSession");
			cmd.setPriority(InfoPriority.HIGH);
			cmd.setDurationToDisplay(30000);
			cmdList.addCmd(cmd);
			this._cmdSession = cmd;

			this.sendNewInfoToClient(cmdList);
		} else if (from == "endSession") {
			this._cmdSession.setDurationToDisplay(0);

			var cmd : Cmd = new Cmd(uuid.v1());
			cmd.setCmd("validatedPicture");
			cmd.setPriority(InfoPriority.HIGH);
			cmd.setDurationToDisplay(10);

			var cmdList : CmdList = new CmdList(uuid.v1());
			cmdList.addCmd(cmd);
			cmdList.addCmd(this._cmdSession);

			this.sendNewInfoToClient(cmdList);
		}
	}
}