/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/session/SessionSourceNamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/CmdList.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/Cmd.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="../t6s-core/core-backend/scripts/RestClientResponse.ts" />
/// <reference path="../t6s-core/core-backend/scripts/stats/StatObject.ts" />
/// <reference path="../t6s-core/core-backend/t6s-core/core/scripts/infotype/priorities/InfoPriority.ts" />
/// <reference path="./sources/Subscribe.ts" />
/// <reference path="./core/PhotoboxPicture.ts" />

var request = require('request');
var formData : any = require('form-data');

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

	private pushStat(step: string, sessionId : string) {
		var stat : StatObject = new StatObject();
		stat.setCollection("service-photobox");
		stat.setSocketId(this.socket.id);
		stat.setIp(this.getIP());
		stat.setSDIId(this.getProfilId().toString());
		stat.setProfilId(this.getSDIId().toString());
		stat.setHash(this.getHashProfil());

		var data = {
			"step": step,
			"sessionId": sessionId
		};

		stat.setData(data);

		var urlPostStat = ServiceConfig.getStatHost()+"create";

		RestClient.post(urlPostStat, stat.toJSON(), function () {
			Logger.debug("Stat has been posted.");
		}, function (err) {
			Logger.debug("Error when posting the stat on the following URL: "+urlPostStat);
		});
	}

	/**
	 * Method called when socket is disconnected.
	 *
	 * @method onClientDisconnection
	 */
	public onClientDisconnection() {
		super.onClientDisconnection();
		var self = this;

		var activeSession = self.getSessionManager().getActiveSession();

		var idActiveSession = "";
		if (activeSession != null) {
			idActiveSession = activeSession.id();
		}

		self.pushStat("SDI disconnected", idActiveSession);

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

		this.pushStat("Start session", session.id());

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

			this.pushStat("Start counter", activeSession.id());

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

				self.pushStat("Post picture", activeSession.id());

				self.sendNewInfoToClient(cmdList);

				Logger.debug("Picture available : "+picture.getURLMediumPicture());
			} else {
				self.getSessionManager().finishActiveSession();
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

		var finishValidate = function () {
			delete self.picturesBySession[activeSession.id()];
			clientNamespace.sessionEndedWithValidation();

			var cmd:Cmd = new Cmd(activeSession.id());

			cmd.setDurationToDisplay(30000);
			cmd.setCmd("validatedPicture");
			cmd.setPriority(InfoPriority.HIGH);

			var cmdList : CmdList = new CmdList(uuid.v1());
			cmdList.addCmd(cmd);
			self.sendNewInfoToClient(cmdList);

			self.pushStat("validate", activeSession.id());

			self.getSessionManager().finishActiveSession();
		};

		this.tweetPicture(picture, finishValidate);
	}

	private tweetPicture = function (picture : PhotoboxPicture, callback) {
		var self = this;
		if (this.getParams().oauthKey && this.getParams().TweetMessage) {
			Logger.debug("Will tweet picture...");
			var oAuthKey = this.getParams().oauthKey;
			var message = this.getParams().TweetMessage;

			var failOAuth = function (err) {
				Logger.error("Error while logging to twitter");
				Logger.debug(err);
				callback();
			};

			var successOAuth = function (oauthActions) {
				Logger.debug("Oauth OK for tweeting");

				var form : any = new formData();
				form.append('media', request(picture.getURLOriginalPicture()));

				var urlUploadPic = "https://upload.twitter.com/1.1/media/upload.json";

				var successUpload = function (result) {
					var media_id = result.media_id;
					Logger.debug("Success to upload picture, media_id : "+media_id);
					self.pushStat("Upload picture on twitter. Media id: "+media_id);

					var urlPost = "/1.1/statuses/update.json?status="+encodeURIComponent(message)+"&media_ids="+media_id;

					var successPostTweet = function (result) {
						var tweetId = result.id_str;
						var username = result.user.name;
						Logger.debug("The tweet has been posted! Account: "+username+" id : "+tweetId);
						self.pushStat("tweet photo account "+username+" and id "+tweetId, self.getSessionManager().getActiveSession().id());
						callback();
					};

					oauthActions.post(urlPost, null, successPostTweet, failOAuth);
				};

				oauthActions.post(urlUploadPic, form, successUpload, failOAuth, form.getHeaders());


			};


			self.manageOAuth('twitter', oAuthKey, successOAuth, failOAuth);
		} else {
			callback();
		}
	};

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
			Logger.error(response.data());
			endSession();
		};

		var success = function () {
			endSession();
		};

		self.pushStat("unvalidate", activeSession.id());

		picture.delete(success, fail);
	}

	public unlockControl(session : Session) {
		var time = 3;
		var cmd:Cmd = new Cmd(session.id());


		this.pushStat("End session", session.id());

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