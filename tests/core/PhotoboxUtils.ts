/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/nock.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/core/PhotoboxUtils.ts" />

var assert = require("assert");

describe('PhotoboxUtils', function() {
	beforeEach(function() {
		sinon.createStubInstance(Photobox);
	});
	describe('#getExtension', function () {
		it('should split properly a file into filename and extension', function () {
			var filename = 'toto.png';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "toto", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "png", "The extension is not properly retrieved : "+split[1]);
		});

		it('should split properly a file into filename and extension event with the path', function () {
			var filename = '/blabla/truc/machin/toto.png';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "toto", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "png", "The extension is not properly retrieved : "+split[1]);
		});

		it('should split properly a file into filename and extension event with dots in the path', function () {
			var filename = '/blabla/truc.titi/toto.png';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "toto", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "png", "The extension is not properly retrieved : "+split[1]);
		});

		it('should return the file if it has no extension', function () {
			var filename = 'toto';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "toto", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "", "The extension is not properly retrieved : "+split[1]);
		});

		it('should return the file if it has no extension but a dot in the path', function () {
			var filename = '/blabla/truc.titi/toto';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "toto", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "", "The extension is not properly retrieved : "+split[1]);
		});

		it('should return the file as an extension if it starts with a dot', function () {
			var filename = '.toto';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "toto", "The extension is not properly retrieved : "+split[1]);
		});

		it('should return the file as an extension if it has a dot in the path and the name starts with a dot', function () {
			var filename = '/blabla/truc.titi/.toto';

			var split = PhotoboxUtils.getFileExtension(filename);

			assert.equal(split[0], "", "The name is not properly retrieved : "+split[0]);
			assert.equal(split[1], "toto", "The extension is not properly retrieved : "+split[1]);
		});
	});

	describe('#getDirectoryFromTag', function () {
		it('should end with a slash', function () {
			var result = PhotoboxUtils.getDirectoryFromTag("bidule");
			assert.equal(result.substr(-1), "/");
		});
	});

	describe('#getCompleteHostName', function () {
		it('should end with a slash', function () {
			var result = PhotoboxUtils.getCompleteHostname();
			assert.equal(result.substr(-1), "/");
		});
	});

	describe('#getBaseURL', function () {
		it('should end with a slash', function () {
			var result = PhotoboxUtils.getBaseURL("toto");
			assert.equal(result.substr(-1), "/");
		});
	});

	describe('#getNewImageNamesFromOriginalImage', function () {
		it('should return an array of three images with medium and small and the right extension', function () {
			var originalImage = "toto.png";

			var result = PhotoboxUtils.getNewImageNamesFromOriginalImage(originalImage);

			assert.equal(result.length, 3, "The array does not contain 3 names");

			var ok = true;

			var small = false;
			var medium = false;

			for (var i = 0; i < result.length; i++) {
				ok = ok && (result[i].indexOf(".png") != -1);

				if ((result[i].indexOf(PhotoboxUtils.MIDDLE_SIZE.identifier) != -1) && (i = 1)) {
					medium = true;
				}
				if ((result[i].indexOf(PhotoboxUtils.SMALL_SIZE.identifier) != -1) && (i = 2)) {
					small = true;
				}
			}

			assert.ok(ok, "The extension is not on every filename");
			assert.ok(medium, "The medium filename is not on second position in the array");
			assert.ok(small, "The small filename is not on final position in the array");
		});
	});


});