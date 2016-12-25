const { expect } = require('chai');
const _ = require('lodash');
const rewire = require('rewire');
const sinon = require('sinon');
const proxyQuire = require('proxyquire');
const getModule = require('tests/getModule');
const P = require('bluebird');

describe('api_avia', function(){

	const config = { yandex: { ok: 0 } }
	const expected = {
		'MOWLED': {
			fares: [1,2,3,4]
		}
	}
	const modelStub = {
		getConfig: function*(){
			return {
				credentials: {
					username: 'hello',
					password: 'boy'
				},
				avia: {
					getOTTFares: {
						headers: {
							Authorization: 'Basic '
						}
					}
				}
			}
		}
	}
	const NetUtilsStub = {
		customRequest: function( options ){
			expect( options ).to.have.deep.equal({
				body: "monkey_ballz",
				headers: {
					Authorization: 'Basic aGVsbG86Ym95'
				}
			});
			var fn = fn || arguments.callee;
			fn.opts = _.merge(fn.opts || {}, options);

			fn.exec = function(){
				return cb => cb( null, expected );
			}
			return fn;
		}
	}

	var aviaApiModule;

	before(function*(){
		const getAviaApi = require('core/api/avia');
		const initAviaApiModule = getModule( getAviaApi );
		aviaApiModule = yield initAviaApiModule( NetUtilsStub, modelStub );
	});

	it('should return ottFares ok', function*(){
		let fares = yield aviaApiModule.getOTTFares("monkey_ballz");
		expect( fares ).to.have.deep.equal( expected );
	})

})