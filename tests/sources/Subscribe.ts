/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/// <reference path="../../libsdef/mocha.d.ts" />
/// <reference path="../../libsdef/sinon.d.ts" />

/// <reference path="../../scripts/sources/Subscribe.ts" />

var assert = require("assert");
var sinon : SinonStatic = require("sinon");

describe('Subscribe', function() {

	var sandbox;
	beforeEach(function () {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function () {
		sandbox.restore();
	});
	
	describe('#constructor', function () {
		it('should launch the createTag with the proper parameters', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').once();

			var params = { Tag: 'toto', Limit: '10', InfoDuration: '15', URL: 'http://toto', LogoLeftURL: 'http://tata', LogoRightURL: 'http://titi', AppliURL: 'http://tutu', CounterDuration: '5'};

			var stubNSManager : any = sandbox.stub(PhotoboxNamespaceManager, "createTag");
			var stubNSManager2 : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			var album = new Subscribe(params, stubNSManager2);

			assert.ok(stubNSManager.calledWithExactly('toto'));
			mockSubscribe.verify();
		});

		it('should not launch run if the parameter Tag is missing', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').never();

			var params = { Limit: '10', InfoDuration: '15', URL: 'http://toto', AppliURL: 'http://tutu', LogoLeftURL: 'http://tata', LogoRightURL: 'http://titi', CounterDuration: '5'};


			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Subscribe(params, stubNSManager);
			mockSubscribe.verify();
		});

		it('should not launch run if the parameter Limit is missing', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').never();

			var params = { Tag: 'toto', InfoDuration: '15', URL: 'http://toto', AppliURL: 'http://tutu', LogoLeftURL: 'http://tata', LogoRightURL: 'http://titi', CounterDuration: '5'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Subscribe(params, stubNSManager);
			mockSubscribe.verify();
		});

		it('should not launch run if the parameter InfoDuration is missing', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').never();

			var params = { Tag: 'toto', Limit: '10', URL: 'http://toto', AppliURL: 'http://tutu', LogoLeftURL: 'http://tata', LogoRightURL: 'http://titi', CounterDuration: '5'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Subscribe(params, stubNSManager);
			mockSubscribe.verify();
		});

		it('should not launch run if the parameter LogoRightURL is missing', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').never();

			var params = { Tag: 'toto', Limit: '10', InfoDuration: '15', URL: 'http://toto', AppliURL: 'http://tutu', CounterDuration: '5', LogoLeftURL: 'http://tata'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Subscribe(params, stubNSManager);
			mockSubscribe.verify();
		});

		it('should not launch run if the parameter LogoLeftURL is missing', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').never();

			var params = { Tag: 'toto', Limit: '10', InfoDuration: '15', URL: 'http://toto', AppliURL: 'http://tutu', CounterDuration: '5', LogoRightURL: 'http://tata'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Subscribe(params, stubNSManager);
			mockSubscribe.verify();
		});

		it('should not launch run if the parameter CounterDuration is missing', function () {
			var mockSubscribe = sandbox.mock(Subscribe.prototype);
			mockSubscribe.expects('run').never();

			var params = { Tag: 'toto', Limit: '10', InfoDuration: '15', URL: 'http://toto', AppliURL: 'http://tutu', LogoLeftURL: 'http://tata', LogoRightURL: 'http://titi'};

			var stubNSManager : any = sinon.createStubInstance(PhotoboxNamespaceManager);
			new Subscribe(params, stubNSManager);
			mockSubscribe.verify();
		});
	});

	describe('#run', function () {

	});
});