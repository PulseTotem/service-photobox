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
		this.addListenerToSocket('Subscribe', function (params, photoboxNamespaceManager) { new Subscribe(params, photoboxNamespaceManager); });
		this.addListenerToSocket('Album', function (params, photoboxNamespaceManager) { new Album(params, photoboxNamespaceManager); });

		this._params = null;
	}

	public setParams(params : any) {
		this._params = params;
	}

	public createTag(tag : string, cloudStorage : boolean) : PhotoboxAlbum {
		if (PhotoboxNamespaceManager._albums[tag] == undefined) {
			Logger.debug("Create the PhotoboxAlbum for tag: "+tag);
			PhotoboxNamespaceManager._albums[tag] = new PhotoboxAlbum(tag, cloudStorage, Photobox.host);
		}
		if (!cloudStorage) {
			var uploadDir = PhotoboxUtils.getDirectoryFromTag(tag);
			fs.open(uploadDir, 'r', function (err, fd) {
				if (err) {
					Logger.debug("The directory "+uploadDir+" is not accessible. The following error has been encountered: "+err);
					try {
						fs.mkdirSync(uploadDir);
					} catch (e) {
						Logger.error("This service is unable to create the tagged directory (path: "+uploadDir+"). Consequently the local storage is unavailable.");
					}

				}
			});
		}
		return PhotoboxNamespaceManager._albums[tag];
	}

	/**
	 * Method called when external message comes from PhotoboxRouter.
	 *
	 *
	 * @method onExternalMessage
	 * @param {string} from - Source description of message
	 * @param {any} message - The received message is a PhotoboxSession here.
	 */
	onExternalMessage(from : string, message : any) {
		if (this._params != null) {
			if (from == "startSession") {
				this.startSession(message);
			} else if (from == "counter") {
				this.startCounter(message);
			} else if (from == "endSession") {
				this.endSession(message);
			} else if (from == "newPicture") {
				this.pushPicture(message);
			}
		}
	}

	private pushPicture(message : any) {
		var tag : string = message.tag;
		var picture : Array<string> = message.pics;

		var album : PhotoboxAlbum = PhotoboxNamespaceManager._albums[tag];
		album.addPicture(picture);
	}

	private startSession(message : any) {
		var cmdList:CmdList = new CmdList(uuid.v1());
		var cmd:Cmd = new Cmd(message._id);
		cmd.setCmd("startSession");
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setDurationToDisplay(30000);
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}

	private startCounter(message : any) {
		var cmd:Cmd = new Cmd(message._id);
		
		cmd.setDurationToDisplay(30000);
		cmd.setPriority(InfoPriority.HIGH);
		cmd.setCmd("counter");

		var args : Array<string> = new Array();
		args.push(this._params.CounterDuration);

		var cloudStorage = JSON.parse(this._params.CloudStorage);
		var postUrl = "http://"+Photobox.host+"/rest/post/"+cmd.getId().toString()+"/"+cloudStorage.toString()+"/"+this._params.Tag;
		Logger.debug("PostURL: "+postUrl);
		args.push(postUrl);
		cmd.setArgs(args);


		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}

	private endSession(message : any) {
		var cmd:Cmd = new Cmd(message._id);

		cmd.setDurationToDisplay(1);
		cmd.setCmd("validatedPicture");
		cmd.setPriority(InfoPriority.HIGH);

		var cmdList : CmdList = new CmdList(uuid.v1());
		cmdList.addCmd(cmd);

		this.sendNewInfoToClient(cmdList);
	}
}