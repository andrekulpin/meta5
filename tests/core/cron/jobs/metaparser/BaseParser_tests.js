const { expect } = require('chai');
const rewire = require('rewire');
const sinon = require('sinon');
const proxyQuire = require('proxyquire');
const getModule = require('tests/getModule');
const P = require('bluebird');

describe('BaseParser', function(){

	const config = { yandex: { ok: 0 } }
	const modelStub = {
		getConfig: function*(){
			config.yandex.ok += 100;
			return config;
		}
	}

	var initBaseParser;

	before(() => {
		const getBaseParser = rewire('core/cron/jobs/metaparser/Parser');
		getBaseParser.__set__('MIN', 10);
		initBaseParser = getModule( getBaseParser );
	});

	it('should return an BaseParser instance ok', function*(){
		var clock = sinon.useFakeTimers();
		let spyFn = sinon.spy( modelStub, 'getConfig' );
		let BaseParser = yield initBaseParser( modelStub );
		let baseParser = new BaseParser( 'yandex' );
		expect( baseParser ).to.have.have.property( 'config' );
		clock.tick(100);
		spyFn.restore();
		clock.restore();
		sinon.assert.calledTwice(spyFn);
		expect( baseParser.config ).to.have.deep.equal( {ok: 200} );

	})

})