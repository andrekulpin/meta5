/*const { expect } = require('chai');
const rewire = require('rewire');

const $$ = require('tests/testUtils');
const co = require('co');

const Utils = require('core/Utils');
const testModule = rewire('core/cron/jobs/metaparser/MetaparserUtils');

testModule.__set__('Request', function*({url, method, headers, body}){
	expect(url).to.equal('bullshit.com');
	return;
});

testModule.__get__('Request');

console.log(testModule)

const initUtils = $$.getModule(testModule);

describe('MetaparserUtils test', function(){

	let metaUtils = initUtils( Utils );
	//console.log(metaUtils.sendRequest)
	it('sendRequest ok', function( done ){

		const options = {
			method: 'GET', 
			headers: '',
			body: null
		}

		co(function*(){

			let ss = yield metaUtils.sendRequest('bullshit.com', options);
			console.log(22)
			console.log(ss)
			done()

		})

	})

})
*/