const defer = require('co-defer');
const _ = require('lodash');
const __init = Symbol('__init');
const { systemUpdateInterval } = require('cluster/config');

module.exports = ['BaseService', function( BaseService ){

	class Updater extends BaseService {
		constructor( fn, interval ){
			super();
			this.interval = interval;
			this.fn = fn;
		}

		[__init](){
			const self = this;
			defer.setInterval(function*(){
				let res = yield _.map( self.fn, fn => fn() );
				self.emit('updated', res);
			}, self.interval || systemUpdateInterval );
		}
	}

	return function( fn, interval ){
		const updater = new Updater( fn, interval );
		updater[__init]();
		return updater;
	}
	
}];