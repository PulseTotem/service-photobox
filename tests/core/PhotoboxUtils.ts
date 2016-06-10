/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/core/PhotoboxUtils.ts" />

var assert = require("assert");

describe('PhotoboxUtils', function() {
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

	describe('#getCompleteHostName', function () {
		it('should end with a slash', function () {
			var result = PhotoboxUtils.getCompleteHostname();
			assert.equal(result.substr(-1), "/");
		});
	});
});