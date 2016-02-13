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

	describe('#retrievePicsFromLocal', function () {
		it('should retrieve pictures from directory', function (done) {
			Logger.setLevel(LoggerLevel.Debug);
			var mockUtils = sandbox.mock(PhotoboxUtils);
			mockUtils.expects('getDirectoryFromTag').atLeast(2).returns('/tmp/upload/test');
			mockUtils.expects('getBaseURL').atLeast(2).returns('http://localhost/upload/test/');

			mockfs({
				"/tmp/upload/test": {
					'blacklist.txt': new Buffer('toto\ntutu'),
					'first.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'first_small.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'first_medium.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'second.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'second_small.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'third.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'third_small.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'third_medium.png': new Buffer([8, 6, 7, 5, 3, 0, 9])
				}
			});

			var urlsFirst = new Array<string>();
			urlsFirst.push("http://localhost/upload/test/first.png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var urlsThird = new Array<string>();
			urlsThird.push("http://localhost/upload/test/third.png");
			urlsThird.push("http://localhost/upload/test/third"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsThird.push("http://localhost/upload/test/third"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var allUrls = [];

			var monstub;

			var findetest = function () {
				mockUtils.verify();
				assert.deepEqual(allUrls, [urlsFirst, urlsThird], "All urls should be present");
				monstub.restore();
				mockfs.restore();
				done();
			};

			var counter = 0;
			var funcAddPicture = function (urls) {
				allUrls.push(urls);
				counter++;
				if (counter == 2) {
					findetest();
				}
			};

			monstub = sandbox.stub(PhotoboxAlbum.prototype, 'addPicture', funcAddPicture);

			new PhotoboxAlbum("test");

		});

		it('should retrieve pictures from directory ignoring medium and small files', function (done) {

			var mockUtils = sandbox.mock(PhotoboxUtils);
			mockUtils.expects('getDirectoryFromTag').atLeast(2).returns('/tmp/upload/test');
			mockUtils.expects('getBaseURL').atLeast(2).returns('http://localhost/upload/test/');

			mockfs({
				"/tmp/upload/test": {
					'blacklist.txt': new Buffer('toto\ntutu'),
					'first.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'first_small.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'first_medium.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'toto_small.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'titi_medium.png': new Buffer([8, 6, 7, 5, 3, 0, 9])
				}
			});

			var urlsFirst = new Array<string>();
			urlsFirst.push("http://localhost/upload/test/first.png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var allUrls = [];

			var monstub;
			var findetest = function () {
				mockUtils.verify();
				assert.deepEqual(allUrls, [urlsFirst], "All urls should be present");
				monstub.restore();
				mockfs.restore();
				done();
			};

			var counter = 0;
			var funcAddPicture = function (urls) {
				allUrls.push(urls);
				counter++;
				if (counter == 1) {
					findetest();
				}
			};

			monstub = sandbox.stub(PhotoboxAlbum.prototype, 'addPicture', funcAddPicture);

			new PhotoboxAlbum("test");

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