/**
 * @author Simon Urli <simon@pulsetotem.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/ClientNamespaceManager.ts" />
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

		this.addListenerToSocket('ValidatePicture', function (callSocketId:any, self:PhotoboxClientNamespaceManager) {
			self.validatePicture(callSocketId);
		});

		this.addListenerToSocket('UnvalidatePicture', function (callSocketId:any, self:PhotoboxClientNamespaceManager) {
			self.unvalidatePicture(callSocketId);
		});
	}

	startCounter(callSocketId : any) {
		var callNamespace : any = this.getCallNamespaceManager();
		callNamespace.startCounter();
	}

	postPicture(picture : string) {
		var self = this;
		this.socket.emit("DisplayPicture", self.formatResponse(true, picture));
	}

	validatePicture(callSocketId : any) {
		var callNamespace : any = this.getCallNamespaceManager();
		callNamespace.validatePicture();
	}

	unvalidatePicture(callSocketId : any) {
		var callNamespace : any = this.getCallNamespaceManager();
		callNamespace.unvalidatePicture();
	}

	sessionEndedWithValidation() {
		this.socket.emit("SessionEndedWithValidation", this.formatResponse(true,""));
	}

	sessionEndedWithoutValidation() {
		this.socket.emit("SessionEndedWithoutValidation", this.formatResponse(true,""));
	}
}