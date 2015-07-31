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

describe('PhotoboxAlbum', function() {
	describe('#constructor', function () {
		it('should work with a simple test', function () {
			var i = 2;
			assert.equal(i, 2);
		});
	});
});