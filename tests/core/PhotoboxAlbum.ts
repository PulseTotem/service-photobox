/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/nock.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/core/PhotoboxAlbum.ts" />

var assert = require("assert");
var nock = require("nock");
var sinon : SinonStatic = require("sinon");
var mockfs = require("mock-fs");

describe.skip('PhotoboxAlbum', function() {
	afterEach(function() {
		mockfs.restore();
	});
	describe('#constructor', function () {
		it('should initialize variable and launch local picture retrieve if cloudStorage is false', function () {
			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').once();
			mockPhotobox.expects('retrievePicsFromCloud').never();

			var albumTag = "toto";

			var photoboxTest = new PhotoboxAlbum(albumTag, false);
			mockPhotobox.verify();

			assert.equal(photoboxTest.getTag(), albumTag, "The album tag is not set properly.");

			var obtained = photoboxTest.getPictures();
			assert.deepEqual(photoboxTest.getPictures(), new Array<Picture>(), "The picture array is not properly set : "+JSON.stringify(obtained)+" | "+JSON.stringify(new Array<Picture>()));
		});

		it('should initialize variable and launch local picture retrieve if cloudStorage is true', function () {
			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').never();
			mockPhotobox.expects('retrievePicsFromCloud').once();

			var albumTag = "blop";

			var photoboxTest = new PhotoboxAlbum(albumTag, true);
			mockPhotobox.verify();

			assert.equal(photoboxTest.getTag(), albumTag, "The album tag is not set properly.");

			var obtained = photoboxTest.getPictures();
			assert.deepEqual(photoboxTest.getPictures(), new Array<Picture>(), "The picture array is not properly set : "+JSON.stringify(obtained)+" | "+JSON.stringify(new Array<Picture>()));
		});
	});

	describe('#retrievePicsFromCloud', function () {
		it('should launch cloudinaryConfig and retrieve pictures from cloudinary API', function () {
			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').never();

			var mockUtils = sinon.mock(PhotoboxUtils);
			mockUtils.expects('configCloudinary').once();

			var mockCloudinary = sinon.mock(cloudinary.api);
			mockCloudinary.expects('resources_by_tag').once();

			new PhotoboxAlbum("test", true);

			mockPhotobox.verify();
			mockUtils.verify();
			mockCloudinary.verify();
		})
	});

	describe('#retrievePicsFromLocal', function () {
		it('should retrieve pictures from directory', function (done) {
			var mockUtils = sinon.mock(PhotoboxUtils);
			mockUtils.expects('getDirectoryFromTag').once().returns('/tmp/upload/test');
			mockUtils.expects('getBaseURL').thrice().returns('http://localhost/upload/test/');

			mockfs({
				"/tmp/upload/test": {
					'first.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'second.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'third.png': new Buffer([8, 6, 7, 5, 3, 0, 9])
				}
			});

			var urlsFirst = new Array<string>();
			urlsFirst.push("http://localhost/upload/test/first.png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var urlsSecond = new Array<string>();
			urlsSecond.push("http://localhost/upload/test/second.png");
			urlsSecond.push("http://localhost/upload/test/second"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsSecond.push("http://localhost/upload/test/second"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var urlsThird = new Array<string>();
			urlsThird.push("http://localhost/upload/test/third.png");
			urlsThird.push("http://localhost/upload/test/third"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsThird.push("http://localhost/upload/test/third"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromCloud').never();

			var allUrls = [];

			var monstub;

			var findetest = function () {
				mockUtils.verify();
				mockPhotobox.verify();
				assert.deepEqual(allUrls, [urlsFirst, urlsSecond, urlsThird], "All urls should be present");
				monstub.restore();
				mockfs.restore();
				done();
			};

			var counter = 0;
			var funcAddPicture = function (urls) {
				allUrls.push(urls);
				counter++;
				if (counter == 3) {
					findetest();
				}
			};

			monstub = sinon.stub(PhotoboxAlbum.prototype, 'addPicture', funcAddPicture);

			new PhotoboxAlbum("test", false);

		});

		it('should retrieve pictures from directory ignoring medium and small files', function (done) {

			var mockUtils = sinon.mock(PhotoboxUtils);
			mockUtils.expects('getDirectoryFromTag').once().returns('/tmp/upload/test');
			mockUtils.expects('getBaseURL').once().returns('http://localhost/upload/test/');

			mockfs({
				"/tmp/upload/test": {
					'first.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'toto_small.png': new Buffer([8, 6, 7, 5, 3, 0, 9]),
					'titi_medium.png': new Buffer([8, 6, 7, 5, 3, 0, 9])
				}
			});

			var urlsFirst = new Array<string>();
			urlsFirst.push("http://localhost/upload/test/first.png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.MIDDLE_SIZE.identifier+".png");
			urlsFirst.push("http://localhost/upload/test/first"+PhotoboxUtils.SMALL_SIZE.identifier+".png");

			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromCloud').never();

			var allUrls = [];

			var monstub;
			var findetest = function () {
				mockUtils.verify();
				mockPhotobox.verify();
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

			monstub = sinon.stub(PhotoboxAlbum.prototype, 'addPicture', funcAddPicture);

			new PhotoboxAlbum("test", false);

		});
	});

	describe('#addPicture', function () {
		it('should create a proper Picture given a URL and tag', function() {
			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').once();
			mockPhotobox.expects('retrievePicsFromCloud').never();

			var albumTag = "blop";

			var photoboxTest = new PhotoboxAlbum(albumTag, false);
			mockPhotobox.verify();

			var urls = ["toto1.png", "toto2.png", "toto3.png"];

			var pic : Picture = new Picture("toto1");
			pic.setTitle("Photobox #"+albumTag);

			var picUrlOriginal : PictureURL = new PictureURL("toto1");
			picUrlOriginal.setURL("toto1.png");
			pic.setOriginal(picUrlOriginal);

			var picUrlMedium : PictureURL = new PictureURL("toto2");
			picUrlMedium.setURL("toto2.png");
			picUrlMedium.setWidth(PhotoboxUtils.MIDDLE_SIZE.width);
			picUrlMedium.setHeight(PhotoboxUtils.MIDDLE_SIZE.height);
			pic.setMedium(picUrlMedium);

			var picUrlSmall : PictureURL = new PictureURL("toto3");
			picUrlSmall.setURL("toto3.png");
			picUrlSmall.setWidth(PhotoboxUtils.SMALL_SIZE.width);
			picUrlSmall.setHeight(PhotoboxUtils.SMALL_SIZE.height);
			pic.setSmall(picUrlSmall);

			var allPics = [pic];

			photoboxTest.addPicture(urls);
			assert.deepEqual(photoboxTest.getPictures(), allPics);
		});
	});

	describe('#getLastPictures', function () {
		it('should return an empty list if there is no picture', function () {
			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').once();
			mockPhotobox.expects('retrievePicsFromCloud').never();

			var albumTag = "blop";

			var photoboxTest = new PhotoboxAlbum(albumTag, false);
			mockPhotobox.verify();

			assert.deepEqual(photoboxTest.getLastPictures(10), []);
		});

		it('should return the last two pictures with a limit 2', function () {
			var mockPhotobox = sinon.mock(PhotoboxAlbum.prototype);
			mockPhotobox.expects('retrievePicsFromLocal').once();
			mockPhotobox.expects('retrievePicsFromCloud').never();

			var albumTag = "blop";

			var photoboxTest = new PhotoboxAlbum(albumTag, false);
			mockPhotobox.verify();

			var urls = ["toto1.png", "toto2.png", "toto3.png"];
			photoboxTest.addPicture(urls);

			urls =  ["titi1.png", "titi2.png", "titi3.png"];
			photoboxTest.addPicture(urls);

			urls = ["tata1.png", "tata2.png", "tata3.png"];
			photoboxTest.addPicture(urls);

			urls =  ["tutu1.png", "tutu2.png", "tutu3.png"];
			photoboxTest.addPicture(urls);

			var pic : Picture = new Picture("tata1");
			pic.setTitle("Photobox #"+albumTag);

			var picUrlOriginal : PictureURL = new PictureURL("tata1");
			picUrlOriginal.setURL("tata1.png");
			pic.setOriginal(picUrlOriginal);

			var picUrlMedium : PictureURL = new PictureURL("tata2");
			picUrlMedium.setURL("tata2.png");
			picUrlMedium.setWidth(PhotoboxUtils.MIDDLE_SIZE.width);
			picUrlMedium.setHeight(PhotoboxUtils.MIDDLE_SIZE.height);
			pic.setMedium(picUrlMedium);

			var picUrlSmall : PictureURL = new PictureURL("tata3");
			picUrlSmall.setURL("tata3.png");
			picUrlSmall.setWidth(PhotoboxUtils.SMALL_SIZE.width);
			picUrlSmall.setHeight(PhotoboxUtils.SMALL_SIZE.height);
			pic.setSmall(picUrlSmall);

			var pic2 : Picture = new Picture("tutu1");
			pic2.setTitle("Photobox #"+albumTag);

			var picUrlOriginal : PictureURL = new PictureURL("tutu1");
			picUrlOriginal.setURL("tutu1.png");
			pic2.setOriginal(picUrlOriginal);

			var picUrlMedium : PictureURL = new PictureURL("tutu2");
			picUrlMedium.setURL("tutu2.png");
			picUrlMedium.setWidth(PhotoboxUtils.MIDDLE_SIZE.width);
			picUrlMedium.setHeight(PhotoboxUtils.MIDDLE_SIZE.height);
			pic2.setMedium(picUrlMedium);

			var picUrlSmall : PictureURL = new PictureURL("tutu3");
			picUrlSmall.setURL("tutu3.png");
			picUrlSmall.setWidth(PhotoboxUtils.SMALL_SIZE.width);
			picUrlSmall.setHeight(PhotoboxUtils.SMALL_SIZE.height);
			pic2.setSmall(picUrlSmall);

			var allPics = [pic, pic2];

			assert.deepEqual(photoboxTest.getLastPictures(2), allPics);
		});
	});
});
mockfs.restore();