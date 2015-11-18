/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/NamespaceManager.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/SessionNamespaceManagerItf.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/Session.ts" />
/// <reference path="../t6s-core/core-backend/scripts/session/SessionStatus.ts" />

/**
 * Represents the PulseTotem Photobox's NamespaceManager to manage connections from mobile clients.
 *
 * @class GuestBookClientNamespaceManager
 * @extends NamespaceManager
 * @implements SessionNamespaceManagerItf
 */
class PhotoboxClientNamespaceManager extends NamespaceManager implements SessionNamespaceManagerItf {

	/**
	 * Call NamespaceManager.
	 *
	 * @property _callNamespaceManager
	 * @type GuestBookNamespaceManager
	 */
	private _callNamespaceManager:PhotoboxNamespaceManager;

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket:any) {
		super(socket);

		this._callNamespaceManager = null;

		this.addListenerToSocket('TakeControl', function (callSocketId:any, self:PhotoboxClientNamespaceManager) {
			self.takeControl(callSocketId);
		});

		this.addListenerToSocket('StartCounter', function (callSocketId:any, self:PhotoboxClientNamespaceManager) {
			self.startCounter(callSocketId);
		});
	}

	/**
	 * Search for callSocket and init a Session to take control on screen.
	 *
	 * @method takeControl
	 * @param {Object} callSocketId - A JSON object with callSocket's Id.
	 */
	takeControl(callSocketId:any) {
		var self = this;

		var callNamespaceManager = self.server().retrieveNamespaceManagerFromSocketId(callSocketId.callSocketId);

		if (callNamespaceManager == null) {
			self.socket.emit("ControlSession", self.formatResponse(false, "NamespaceManager corresponding to callSocketid '" + callSocketId.callSocketId + "' doesn't exist."));
		} else {
			self._callNamespaceManager = callNamespaceManager;

			var newSession:Session = callNamespaceManager.newSession(self);

			self.socket.emit("ControlSession", self.formatResponse(true, newSession));
		}
	}

	startCounter(callSocketId : any) {
		var self = this;

		if (self._callNamespaceManager != null) {
			self._callNamespaceManager.startCounter();
		}
	}

	/**
	 * Lock the control of the Screen for the Session in param.
	 *
	 * @method lockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	lockControl(session : Session) {
		var self = this;

		self.socket.emit("LockedControl", self.formatResponse(true, session));
	}

	/**
	 * Unlock the control of the Screen for the Session in param.
	 *
	 * @method unlockControl
	 * @param {Session} session - Session which takes the control of the Screen.
	 */
	unlockControl(session : Session) {
		var self = this;

		self.socket.emit("UnlockedControl", self.formatResponse(true, session));
	}

	/**
	 * Method called when socket is disconnected.
	 *
	 * @method onClientDisconnection
	 */
	onClientDisconnection() {
		var self = this;

		this.onDisconnection();

		if(self._callNamespaceManager != null) {
			self._callNamespaceManager.getSessionManager().finishActiveSession();
		}
	}
}