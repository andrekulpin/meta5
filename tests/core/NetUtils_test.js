const { expect } = require('chai');
const sinon = require('sinon');
const proxyQuire = require('proxyquire');
const getModule = require('tests/getModule');
const P = require('bluebird');

describe('NetUtils', function(){

	var netUtils;
	var OK = { body: 'OK', headers: 200 };

	before( () => {
		const requestStub = ( url, cb ) => setImmediate( () => cb( null, OK ) );
		const UtilsDep = require( 'core/Utils' );
		const getNetUtils = proxyQuire( 'core/NetUtils', { 'request': requestStub } );
		netUtils = getModule( getNetUtils )( UtilsDep );
	})

	it('should customRequest ok', function*(){
		let res = yield netUtils.customRequest({method: 'POST'}, 'http://www.zaloopa.com');
		expect( res ).to.deep.equal( OK );
	});

	it('should getProxy ok', function*(){
		let res = netUtils.getProxy(['http://goodproxy:8099']);
		expect( res ).to.equal( 'http://goodproxy:8099' );
	});

})