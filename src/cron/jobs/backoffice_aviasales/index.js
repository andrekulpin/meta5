const P = require('bluebird');

module.exports = ['CronUtils', 'models/metaparser', function( utils, db ){

	var count = 0

	return function*(){

		console.log(++count);

		yield defer(2000);

	}

}]

function defer(n){
	return new P(function(resolve){
		setTimeout(function(){
			resolve();
		}, n)
	})
}