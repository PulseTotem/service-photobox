/**
 * @author Christian Brel <christian@the6thscreen.fr, ch.brel@gmail.com>
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../t6s-core/core-backend/scripts/server/SourceNamespaceManager.ts" />

/// <reference path="./sources/CloudConnectePhotobox.ts" />

class PhotoboxNamespaceManager extends SourceNamespaceManager {

	/**
	 * Constructor.
	 *
	 * @constructor
	 * @param {any} socket - The socket.
	 */
	constructor(socket : any) {
		super(socket);
		this.addListenerToSocket('CloudConnectePhotobox', function(params : any, self : PhotoboxNamespaceManager) { (new CloudConnectePhotobox(params, self)) });
	}
}