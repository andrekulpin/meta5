const defer = require('co-defer');
const _ = require('lodash');
const { EventEmitter } = require('events');
const { systemUpdateInterval } = require('cluster/config');

module.exports = function( fn, interval ){

	class Updater extends EventEmitter {
		constructor( fn ){
			super();
			this.interval = interval;
			this.fn = fn;
		}

		init(){
			const self = this;
			defer.setInterval(function*(){
				let res = yield _.map( self.fn, fn => fn() );
				self.emit('updated', res);
			}, self.interval || systemUpdateInterval );
		}
	}

	if(!_.isArray( fn ) && !_.isFunction( fn )){
		throw new Error('A function or an array is expected.')
	}

	const updater = new Updater( fn, interval );
	updater.init();
	return updater;
	
}