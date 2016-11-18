const { expect } = require('chai');
const sinon = require('sinon');
const { keys } = require('lodash');
const proxyQuire = require('proxyquire');
const getInjector = proxyQuire('cluster/Injector', {});
const dummyFolder = __dirname + '/dummy_project';

describe('Injector', function(){

	it('returns an instance ok', function*(){
		let injector = yield getInjector( dummyFolder );
		expect(injector).to.have.property('dependencies');
		expect(injector).to.have.property('factories');
	});

	it('returns an instance fail', function*(){
		const msg = "ENOENT: no such file or directory, scandir 'path/bullshit_file.js'";
		try {
			yield getInjector('path/bullshit_file.js');
		} catch(err){
			expect(err.message).to.equal(msg);
		}
	});
	
})

describe('cluster/Injector functionality', function(){

	/*
		dummy project for testing purposes

		| -- index.js
		| -- router.js
		| -- models
			 | -- user.js
			 | -- order.js
			 | -- city.js
		| -- controllers
			 | -- user.js
			 | -- order.js
			 | -- city.js
	*/

	before(function*(){
		injector = yield getInjector( dummyFolder );
	});

	it('should get a module by name', function*(){
		let module = yield injector.get('Router');
		expect( module ).to.be.an('object');
		expect( module ).to.have.property('deps');
	});

	it('should get a module by path', function*(){
		let module = yield injector.get('models/user');
		expect( module ).to.be.an('array');
	});

	it('should get several modules at once', function*(){
		let modules = yield injector.get('models/*');
		expect( modules ).to.be.an('object');
		expect( keys( modules ) ).to.have.length.of.at.least(3);
	});

	it('should throw if a module name is too ambiguous', function*(){
		const msg = 'Too many dependencies found with user';
		try {
			let modules = yield injector.get('user');
		} catch(err){
			expect(err.message).to.equal(msg);
		}
	});

	it('should throw if a module required doesn\'t exist', function*(){
		const msg = 'Cannot find a module bullshit';
		try {
			let modules = yield injector.get('bullshit');
		} catch(err){
			expect(err.message).to.equal(msg);
		}
	});

});
