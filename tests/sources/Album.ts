/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/sources/Album.ts" />

var assert = require("assert");
var sinon : SinonStatic = require("sinon");

describe('Album', function() {
	var sandbox;
	beforeEach(function () {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
	});
	
	describe('#constructor', function () {
		it('should launch the createTag with the proper parameters', function () {
			var mockAlbum = sandbox.mock(Album.prototype);
			mockAlbum.expects('run').once();

			var params = { Tag: 'toto', Limit: '10', InfoDuration: '15'};

			var stubNSManager : any = sandbox.stub(PhotoboxNamespaceManager, "createTag");
			var stubNSManager2 : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			var album = new Album(params, stubNSManager2);

			assert.ok(stubNSManager.calledWithExactly('toto'));
			mockAlbum.verify();
		});

		it('should not launch run if the parameter Tag is missing', function () {
			var mockAlbum = sandbox.mock(Album.prototype);
			mockAlbum.expects('run').never();

			var params = { Limit: '10', InfoDuration: '15'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Album(params, stubNSManager);
			mockAlbum.verify();
		});

		it('should not launch run if the parameter Limit is missing', function () {
			var mockAlbum = sandbox.mock(Album.prototype);
			mockAlbum.expects('run').never();

			var params = { Tag: 'toto', InfoDuration: '15'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Album(params, stubNSManager);
			mockAlbum.verify();
		});

		it('should not launch run if the parameter InfoDuration is missing', function () {
			var mockAlbum = sandbox.mock(Album.prototype);
			mockAlbum.expects('run').never();

			var params = { Tag: 'toto', Limit: '10'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Album(params, stubNSManager);
			mockAlbum.verify();
		});
	});
});