/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/core/PhotoboxAlbum.ts" />

var assert = require("assert");
var sinon : SinonStatic = require("sinon");
var mockfs = require("mock-fs");

describe('PhotoboxAlbum', function() {
	var sandbox;
	beforeEach(function () {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
		mockfs.restore();
	});
	describe('#constructor', function () {
		it('should initialize variable and launch local picture retrieve', function () {
			var mockPhotobox = sandbox.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').once();

			var albumTag = "toto";

			var photoboxTest = new PhotoboxAlbum(albumTag);
			mockPhotobox.verify();

			assert.equal(photoboxTest.getTag(), albumTag, "The album tag is not set properly.");

			var obtained = photoboxTest.getPictures();
			assert.deepEqual(photoboxTest.getPictures(), new Array<Picture>(), "The picture array is not properly set : "+JSON.stringify(obtained)+" | "+JSON.stringify(new Array<Picture>()));
		});
	});

	describe('#getLastPictures', function () {
		it('should return an empty list if there is no picture', function () {
			var mockPhotobox = sandbox.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').once();

			var albumTag = "blop";

			var photoboxTest = new PhotoboxAlbum(albumTag);
			mockPhotobox.verify();

			assert.deepEqual(photoboxTest.getLastPictures(10), []);
		});
	});
});
mockfs.restore();