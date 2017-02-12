const { expect } = require('chai');
const rewire = require('rewire');

let testModule = rewire('src/utils');

describe('src/Utils', function(){

	it('should renderString ok', function( done ){
		const wantedGreeting = 'hello there Mark';
		const greeting1 = testModule.renderString({ name: 'Mark' }, 'hello there {name}');
		const greeting2 = testModule.renderString('hello there {name}', { name: 'Mark' });
		const curried1 = testModule.renderString('hello there {name}');
		const greeting3 = curried1({ name: 'Mark' });
		const curried2 = testModule.renderString({ name: 'Mark' });
		const greeting4 = curried2('hello there {name}');
		expect(greeting1).to.equal(wantedGreeting);
		expect(greeting2).to.equal(wantedGreeting);
		expect(greeting3).to.equal(wantedGreeting);
		expect(greeting4).to.equal(wantedGreeting);
		done();
	});

})