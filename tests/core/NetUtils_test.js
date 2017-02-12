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
		const UtilsDep = require( 'src/utils' );
		const getNetUtils = proxyQuire( 'src/utils/NetUtils', { 'request': requestStub } );
		netUtils = getModule( getNetUtils )( UtilsDep );
	})

	it('should customRequest ok', function*(){
		let request = netUtils.customRequest({method: 'POST', url: 'http://www.zaloopa.com'});
		let res = yield request.exec();
		expect( res ).to.deep.equal( OK );
	});

	it('should getProxy ok', function*(){
		let res = netUtils.getProxy(['http://goodproxy:8099']);
		expect( res ).to.equal( 'http://goodproxy:8099' );
	});

})