/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceServer.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />

/// <reference path="./PhotoboxNamespaceManager.ts" />
/// <reference path="./PhotoboxRouter.ts" />
/// <reference path="./PhotoboxUtils.ts" />


/**
 * Represents the The 6th Screen Photobox Service.
 *
 * @class Notifier
 * @extends SourceServer
 */
class Photobox extends SourceServer {

	public static host : string;

	/**
	 * Constructor.
	 *
	 * @param {number} listeningPort - Server's listening port..
	 * @param {Array<string>} arguments - Server's command line arguments.
	 */
	constructor(listeningPort : number, arguments : Array<string>) {
		super(listeningPort, arguments);

		Photobox.host = process.env.PHOTOBOX_HOST;
		Logger.debug("Registered host: "+Photobox.host);
		this.init();

	}

	/**
	 * Method to init the Notifier server.
	 *
	 * @method init
	 */
	init() {
		var self = this;

		this.addAPIEndpoint("rest", PhotoboxRouter);

		this.addNamespace("Photobox", PhotoboxNamespaceManager);

		var rootUpload = PhotoboxUtils.ROOT_UPLOAD;

		fs.open(rootUpload, 'r', function (err, fd) {
			if (err) {
				try {
					fs.mkdirSync(rootUpload);
				} catch (e) {
					Logger.error("This service is unable to create the upload directory (path: "+rootUpload+"). Consequently the local storage is unavailable.");
				}

			}
		});
		this.serveStaticDirectory(rootUpload);
	}
}

/**
 * Server's Photobox listening port.
 *
 * @property _PhotoboxListeningPort
 * @type number
 * @private
 */
var _PhotoboxListeningPort : number = process.env.PORT || 6012;

/**
 * Server's Photobox command line arguments.
 *
 * @property _PhotoboxArguments
 * @type Array<string>
 * @private
 */
var _PhotoboxArguments : Array<string> = process.argv;

var serverInstance = new Photobox(_PhotoboxListeningPort, _PhotoboxArguments);
serverInstance.run();