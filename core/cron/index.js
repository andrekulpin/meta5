const { each } = require('lodash');

module.exports = ['jobs/*' function( jobs ){
	return function*( config ){
		//Initiates all the crons
		yield each( jobs, initJob => initJob );
	}
}]