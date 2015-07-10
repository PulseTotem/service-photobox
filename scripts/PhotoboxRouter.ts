/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/RouterItf.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />

/**
 * NotifierRouter class.
 *
 * @class NotifierRouter
 * @extends RouterItf
 */
class PhotoboxRouter extends RouterItf {

	/**
	 * Constructor.
	 */
	constructor() {
		super();
	}

	/**
	 * Method called during Router creation.
	 *
	 * @method buildRouter
	 */
	buildRouter() {
		var self = this;

		// define the '/' route
		this.router.post('/startSession', function(req : any, res : any) { self.startSession(req, res); });
		this.router.post('/endSession', function(req : any, res : any) { self.endSession(req, res); });
		this.router.post('/counter', function(req : any, res : any) { self.counter(req, res); });
		this.router.post('/postPic', function(req : any, res : any) { self.postPic(req, res); });
	}

	/**
	 * New Notification.
	 *
	 * @method newNotification
	 * @param {Express.Request} req - Request object.
	 * @param {Express.Response} res - Response object.
	 */
	startSession(req : any, res : any) {
		Logger.debug("Receive start session message");
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("startSession", req.body);

		res.end();
	}

	endSession(req : any, res : any) {
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("endSession", req.body);

		res.end();
	}

	counter(req : any, res : any) {
		// TODO : It's not a broadcast !
		this.server.broadcastExternalMessage("counter", req.body);

		res.end();
	}

	postPic(req : any, res : any) {
		Logger.debug("Just catch the postPic with following information :");
		Logger.debug(req);
		// TODO : It's not a broadcast !
		//this.server.broadcastExternalMessage("counter", req.body);

		res.end();
	}
}