const P = require('bluebird');

module.exports = ['CronUtils', 'models/aviaparser', function( utils, db ){

	var count = 0

	return function * (){

		console.log(++count);

		yield P.delay(5000)

	}

}]
