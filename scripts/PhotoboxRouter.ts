/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/RouterItf.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />
/// <reference path="./core/PhotoboxSessionStep.ts" />
/// <reference path="./core/PhotoboxSession.ts" />
/**
 * NotifierRouter class.
 *
 * @class NotifierRouter
 * @extends RouterItf
 */
class PhotoboxRouter extends RouterItf {

	/**
	 * List of sessions currently opened
	 *
	 * @property _sessions
	 * @type {Array<PhotoboxSession>}
	 * @private
	 */
	private _sessions : Array<PhotoboxSession>;

	/**
	 * Constructor.
	 */
	constructor() {
		super();
		this._sessions = new Array<PhotoboxSession>();
	}

	/**
	 * Retrieve a session given its ID
	 *
	 * @method retrieveSession
	 * @param sessionId the ID of the session to retrieve
	 * @returns {PhotoboxSession} the session or null if no session has been found
	 */
	private retrieveSession(sessionId : string) : PhotoboxSession {
		for (var i = 0; i < this._sessions.length; i++) {
			if (this._sessions[i].getId() === sessionId) {
				return this._sessions[i];
			}
		}
		return null;
	}

	/**
	 * Delete all session whom step is END
	 *
	 * @method purgeSession
	 * @private
	 */
	private purgeSession() {
		var self = this;
		this._sessions = this._sessions.filter(function (session : PhotoboxSession) {
			return session.getStep() != PhotoboxSessionStep.END;
		});
	}

	/**
	 * Method called during Router creation.
	 *
	 * @method buildRouter
	 */
	buildRouter() {
		var self = this;

		// define the '/' route
		this.router.post('/start/:sessionid', function(req : any, res : any) { self.startSession(req, res); });
		this.router.post('/counter/:sessionid', function(req : any, res : any) { self.counter(req, res); });
		this.router.post('/post/:sessionid/:cloudStorage/:tag', function(req : any, res : any) { self.post(req, res); });

		this.router.post('/validate/:sessionid', function(req : any, res : any) { self.validate(req, res); });
		this.router.post('/unvalidate/:sessionid', function(req : any, res : any) { self.unvalidate(req, res); });

		this.router.get('/pictures/:sessionid', function(req : any, res : any) { self.getPictures(req, res); });
		this.router.get('/state/:sessionid', function(req : any, res : any) { self.getStateSession(req, res); });
	}

	/**
	 * Start a session with a given session id
	 *
	 * @method startSession
	 * @param {Express.Request} req - Request object.
	 * @param {Express.Response} res - Response object.
	 */
	startSession(req : any, res : any) {
		Logger.debug("Receive start session message");

		var sessionid = req.params.sessionid;
		var session = this.retrieveSession(sessionid);

		if (!sessionid || session != null) {
			res.status(500).send("Please send a valid and unique sessionid");
		} else {
			Logger.debug("Create session with id: "+sessionid);
			var session = new PhotoboxSession(sessionid, this.server);
			this._sessions.push(session);

			session.start(res);
		}
	}

	/**
	 * Launch a counter time to take the picture.
	 *
	 * @method counter
	 * @param req
	 * @param res
	 */
	counter(req : any, res : any) {
		var sessionid = req.params.sessionid;

		var session = this.retrieveSession(sessionid);
		if (session == null) {
			res.status(404).send("Session cannot be found.");
		} else {
			session.counter(res);
		}
	}

	/**
	 * Post pictures
	 *
	 * @param req
	 * @param res
	 */
	post(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var cloudstorage = JSON.parse(req.params.cloudStorage);
		var tag = req.params.tag;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session == null) {
			res.status(404).send("Session cannot be found.");
		} else {
			session.setCloudStorage(cloudstorage);
			session.setTag(tag);
			session.post(req.files.webcam, res);
		}
	}


	validate(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session != null) {
			session.validate(res);
			this.purgeSession();
		} else {
			res.status(404).send("Session cannot be found.");
		}

	}

	unvalidate(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session != null) {
			session.unvalidate(res);
			this.purgeSession();
		} else {
			res.status(404).send("Session cannot be found.");
		}

	}

	getPictures(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session != null) {
			var urls : Array<string> = session.getPicturesURL();
			if (urls.length == 0) {
				res.status(204).send("Picture not ready yet");
			} else {
				res.status(200).json(urls);
			}
		} else {
			res.status(404).send("Session cannot be found.");
		}
	}

	getStateSession(req : any, res : any) {
		var sessionid = req.params.sessionid;
		var session : PhotoboxSession = this.retrieveSession(sessionid);

		if (session != null) {
			var sessionState : string;
			if (session.getStep() == null) {
				sessionState = "null";
			} else {
				sessionState = PhotoboxSessionStep[session.getStep()];
			}
			res.status(200).json({state: sessionState});
		} else {
			res.status(404).send("Session cannot be found.");
		}
	}

}