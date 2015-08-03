/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/nock.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/sources/Album.ts" />

var assert = require("assert");
var sinon : SinonStatic = require("sinon");

describe('Album', function() {
	beforeEach(function() {
		sinon.createStubInstance(Photobox);
	});
	describe('#constructor', function () {
		it('should launch the createTag with the proper parameters', function () {
			var mockAlbum = sinon.mock(Album.prototype);
			mockAlbum.expects('run').once();

			var params = { CloudStorage: 'false', Tag: 'toto', Limit: '10', InfoDuration: 15};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			var album = new Album(params, stubNSManager);

			assert.ok(stubNSManager.createTag.calledWithExactly('toto', false));
			mockAlbum.verify();
		});

		it('should throw an error if a parameter is missing', function () {
			var mockAlbum = sinon.mock(Album.prototype);
			mockAlbum.expects('run').never();

			var params = { Tag: 'toto', Limit: '10', InfoDuration: 15 };

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			assert.throws(function() {new Album(params, stubNSManager);}, "The error is not thrown");
			mockAlbum.verify();
		});
	});

	describe('#run', function () {
		it('should create the proper photo album given params and obtained pictures', function () {
			var params = { CloudStorage: 'false', Tag: 'toto', Limit: '1', InfoDuration: 15};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			var mockalbum = sinon.mock(PhotoboxAlbum.prototype);
			mockalbum.expects("retrievePicsFromLocal").once();

			var photoAlbum : PhotoboxAlbum = new PhotoboxAlbum("toto", false);
			photoAlbum.addPicture(["toto1.png","toto2.png","toto3.png"]);
			photoAlbum.addPicture(["tata.png","tatab.png","tatac.png"]);

			stubNSManager.createTag.withArgs('toto', false).returns(photoAlbum);

			var mockuuid = sinon.mock(uuid);
			mockuuid.expects("v1").once().returns("uuid");

			var expected : PictureAlbum = new PictureAlbum("uuid");
			var pic : Picture = photoAlbum.getLastPictures(1)[0];
			pic.setDurationToDisplay(15);
			expected.addPicture(pic);

			var album : Album = new Album(params, stubNSManager);

			assert.ok(stubNSManager.sendNewInfoToClient.calledWithExactly(expected));
			mockalbum.verify();
			mockuuid.verify();
		});
	});
});