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
class PhotoboxClientNamespaceManager extends ClientNamespaceManager {

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket:any) {
		super(socket);

		var self = this;

		this.addListenerToSocket('StartCounter', function (callSocketId:any, self:PhotoboxClientNamespaceManager) {
			self.startCounter(callSocketId);
		});
	}

	startCounter(callSocketId : any) {
		this.getCallNamespaceManager().startCounter();
	}

	postPicture(picture : any) {

		var tag = this.getCallNamespaceManager().getParams().Tag;
		var watermarkURL = this.getCallNamespaceManager().getParams().WatermarkURL;
	}
}