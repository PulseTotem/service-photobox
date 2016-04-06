/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/session/SessionSourceNamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/CmdList.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/Cmd.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../t6s-core/core-backend/scripts/RestClientResponse.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/priorities/InfoPriority.ts" />
/// <reference path="./sources/Subscribe.ts" />
/// <reference path="./core/PhotoboxPicture.ts" />

class PhotoboxNamespaceManager extends SessionSourceNamespaceManager {
	private picturesBySession = {};

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket : any) {
		super(socket);
		var self = this;
		this.addListenerToSocket('Subscribe', function (params, photoboxNamespaceManager) { new Subscribe(params, photoboxNamespaceManager); });

		this.socket.on('PostPicture', function (msg) { self.postPicture(msg); } );
	}

	/**
	 * Method called when socket is disconnected.
	 *
	 * @method onClientDisconnection
	 */
	public onClientDisconnection() {
		super.onClientDisconnection();
		var self = this;

		self.getSessionManager().finishActiveSession();
	}

	/**
	 * Lock the control of the Screen for the Session in param.
	 *
	 * @method lockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	lockControl(session : Session) {
		var cmdList:CmdList = new CmdList(uuid.v1());
		var cmd:Cmd = new Cmd(session.id());

		cmd.setCmd("startSession");
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setDurationToDisplay(30000);
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}

	public startCounter() {
		var self = this;
		var activeSession : Session = self.getSessionManager().getActiveSession();

		if (activeSession != null) {
			var cmd:Cmd = new Cmd(activeSession.id());

			cmd.setDurationToDisplay(30000);
			cmd.setPriority(InfoPriority.HIGH);
			cmd.setCmd("counter");

			var args : Array<string> = new Array();
			args.push(this.getParams().CounterDuration);

			cmd.setArgs(args);

			var cmdList : CmdList = new CmdList(uuid.v1());
			cmdList.addCmd(cmd);

			this.sendNewInfoToClient(cmdList);
		} else {
			Logger.error("Try to launch start counter without any active session!");
		}
	}

	public postPicture(image : any) {
		var self = this;
		var activeSession : Session = self.getSessionManager().getActiveSession();

		var cmsAlbumId = this.getParams().CMSAlbumId;
		var logoLeftURL = this.getParams().LogoLeftURL;
		var logoRightURL = this.getParams().LogoRightURL;
		var clientNamespace : any = self.getSessionManager().getAttachedNamespace(activeSession.id());

		var callback = function (success : boolean, picture : PhotoboxPicture) {
			if (success) {
				self.picturesBySession[activeSession.id()] = picture;
				clientNamespace.postPicture(picture.getURLMediumPicture());

				var cmdList:CmdList = new CmdList(uuid.v1());
				var cmd:Cmd = new Cmd(activeSession.id());

				cmd.setCmd("postedPicture");
				cmd.setPriority(InfoPriority.HIGH);
				cmd.setDurationToDisplay(30000);
				cmdList.addCmd(cmd);

				self.sendNewInfoToClient(cmdList);

				Logger.debug("Picture available : "+picture.getURLMediumPicture());
			} else {
				// TODO Error to screen and mobile
				Logger.error(picture);
			}
		};

		PhotoboxUtils.postAndApplyWatermark(image, "image.jpg", cmsAlbumId, logoLeftURL, logoRightURL, callback);

	}

	public validatePicture() {
		var self = this;
		var activeSession : Session = self.getSessionManager().getActiveSession();
		var clientNamespace : any = self.getSessionManager().getAttachedNamespace(activeSession.id());
		var picture : PhotoboxPicture = self.picturesBySession[activeSession.id()];
		delete self.picturesBySession[activeSession.id()];
		clientNamespace.sessionEndedWithValidation();

		var cmd:Cmd = new Cmd(activeSession.id());

		cmd.setDurationToDisplay(30000);
		cmd.setCmd("validatedPicture");
		cmd.setPriority(InfoPriority.HIGH);

		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);
		this.sendNewInfoToClient(cmdList);

		self.getSessionManager().finishActiveSession();
	}

	public unvalidatePicture() {
		var self = this;
		var activeSession : Session = self.getSessionManager().getActiveSession();
		var clientNamespace : any = self.getSessionManager().getAttachedNamespace(activeSession.id());
		var picture : PhotoboxPicture = self.picturesBySession[activeSession.id()];

		var endSession = function() {
			delete self.picturesBySession[activeSession.id()];
			self.getSessionManager().finishActiveSession();
			clientNamespace.sessionEndedWithoutValidation();
		};

		var fail = function (response : RestClientResponse) {
			Logger.error("Error while deleting picture: "+picture.getId());
			Logger.error(response);
			endSession();
		};

		var success = function () {
			endSession();
		};

		picture.delete(success, fail);
	}

	public unlockControl(session : Session) {
		var time = 3;
		var cmd:Cmd = new Cmd(session.id());

		cmd.setDurationToDisplay(time);
		cmd.setCmd("removeInfo");
		cmd.setPriority(InfoPriority.HIGH);

		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);
		this.sendNewInfoToClient(cmdList);

		var self = this;
		var timeoutFunc = function () {
			cmd.setDurationToDisplay(0);

			self.sendNewInfoToClient(cmdList);
		};

		this.sendNewInfoToClient(cmdList);

		setTimeout(timeoutFunc, time * 1000);
	}
}