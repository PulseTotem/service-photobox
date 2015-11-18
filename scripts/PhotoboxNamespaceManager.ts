/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceNamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/CmdList.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/Cmd.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/priorities/InfoPriority.ts" />
/// <reference path="./sources/Album.ts" />
/// <reference path="./sources/Subscribe.ts" />

class PhotoboxNamespaceManager extends SessionSourceNamespaceManager {

	private static _albums : any = {};
	private _params : any;


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
		this.addListenerToSocket('Album', function (params, photoboxNamespaceManager) { new Album(params, photoboxNamespaceManager); });

		this.socket.on('postPicture', self.postPicture);
		this._params = null;
	}

	public setParams(params : any) {
		this._params = params;
	}

	public static createTag(tag : string) : PhotoboxAlbum {
		if (PhotoboxNamespaceManager._albums[tag] == undefined) {
			Logger.debug("Create the PhotoboxAlbum for tag: "+tag);
			PhotoboxNamespaceManager._albums[tag] = new PhotoboxAlbum(tag);
		}
		var uploadDir = PhotoboxUtils.getDirectoryFromTag(tag);
		fs.open(uploadDir, 'r', function (err, fd) {
			if (err) {
				Logger.debug("The directory "+uploadDir+" is not accessible. The following error has been encountered: "+err+".\nPhotobox is now trying to create it.");
				try {
					fs.mkdirSync(uploadDir);
					fs.writeFileSync(uploadDir+"index.html","");
					Logger.debug("Creation of the directory "+uploadDir+" successful!");
				} catch (e) {
					Logger.error("This service is unable to create the tagged directory (path: "+uploadDir+"). Consequently the local storage is unavailable.");
				}
			} else {
				fs.closeSync(fd);
			}
		});
		return PhotoboxNamespaceManager._albums[tag];
	}

	public static getTags() : Array<string> {
		return Object.keys(PhotoboxNamespaceManager._albums);
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
			args.push(this._params.CounterDuration);

			var postUrl = "http://"+Photobox.host+"/rest/post/"+cmd.getId().toString()+"/"+this._params.Tag+"/"+encodeURIComponent(this._params.WatermarkURL);
			Logger.debug("PostURL: "+postUrl);
			args.push(postUrl);
			cmd.setArgs(args);


			var cmdList : CmdList = new CmdList(uuid.v1());
			cmdList.addCmd(cmd);

			this.sendNewInfoToClient(cmdList);
		}
	}

	public postPicture(image : any) {

	}


	private pushPicture(message : any) {
		var tag : string = message.tag;
		var picture : Array<string> = message.pics;

		var album : PhotoboxAlbum = PhotoboxNamespaceManager._albums[tag];
		album.addPicture(picture);
	}

	private endSession(message : any) {
		var time = parseInt(this._params.InfoDuration);

		var cmd:Cmd = new Cmd(message._id);

		cmd.setDurationToDisplay(time);
		cmd.setCmd("validatedPicture");
		cmd.setPriority(InfoPriority.HIGH);

		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);

		var self = this;
		var timeoutFunc = function () {
			cmd.setDurationToDisplay(0);

			self.sendNewInfoToClient(cmdList);
		};

		this.sendNewInfoToClient(cmdList);

		setTimeout(timeoutFunc, time * 1000);
	}
}