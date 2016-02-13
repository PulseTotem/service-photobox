/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceServer.ts" />
/// <reference path="../t6s-core/core-backend/scripts/Logger.ts" />

/// <reference path="./PhotoboxNamespaceManager.ts" />
/// <reference path="./PhotoboxClientNamespaceManager.ts" />
/// <reference path="./core/PhotoboxUtils.ts" />

var fs : any = require('fs');

/**
 * Represents the The 6th Screen Photobox Service.
 *
 * @class Notifier
 * @extends SourceServer
 */
class Photobox extends SourceServer {

	public static host : string;
	public static upload_directory : string;
	public static serving_upload_dir : string = "uploads";

	/**
	 * Constructor.
	 *
	 * @param {number} listeningPort - Server's listening port..
	 * @param {Array<string>} arguments - Server's command line arguments.
	 */
	constructor(listeningPort : number, arguments : Array<string>) {
		super(listeningPort, arguments);

		if (process.env.PHOTOBOX_HOST == undefined) {
			Photobox.host = "localhost:6012";
		} else {
			Photobox.host = process.env.PHOTOBOX_HOST;
		}

		if (process.env.PHOTOBOX_UPLOAD_DIR == undefined) {
			Photobox.upload_directory = "/tmp/uploads";
		} else {
			Photobox.upload_directory = process.env.PHOTOBOX_UPLOAD_DIR;
		}

		Logger.debug("Registered host: "+Photobox.host);
		Logger.debug("Local storage directory :"+Photobox.upload_directory);
		this.init();

	}

	/**
	 * Method to init the Notifier server.
	 *
	 * @method init
	 */
	init() {
		var self = this;

		this.addNamespace("Photobox", PhotoboxNamespaceManager);
		this.addNamespace("PhotoboxClient", PhotoboxClientNamespaceManager);

		fs.open(Photobox.upload_directory, 'r', function (err, fd) {
			if (err) {
				Logger.debug("The directory "+Photobox.upload_directory+" is not accessible. The following error has been encountered: "+err+".\nPhotobox is now trying to create it.");
				try {
					fs.mkdirSync(Photobox.upload_directory);
					fs.writeFileSync(Photobox.upload_directory+"/index.html","");
					Logger.debug("Creation of "+Photobox.upload_directory+" successful!");
				} catch (e) {
					Logger.error("This service is unable to create the upload directory (path: "+Photobox.upload_directory+"). Consequently the local storage is unavailable.");
				}
			}  else {
				fs.closeSync(fd);
			}
		});
		this.app.use("/"+Photobox.serving_upload_dir, express.static(Photobox.upload_directory));
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