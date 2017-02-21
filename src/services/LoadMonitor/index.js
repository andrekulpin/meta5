const __init = Symbol('__init');
const { extend } = require('lodash');
const os = require('os');
const { systemUpdateInterval } = require('cluster/config');

module.exports = ['BaseService', function( BaseService ){

	class LoadMonitor extends BaseService {
		constructor( interval ){
			super();
			this.interval = interval;
		}

		[__init](){
			const self = this;
			setInterval(function(){
				const load = getLoadObject();
				const stats = extend({}, load, { action: 'unitstat'});
				self.log.info( stats );
			}, self.interval || systemUpdateInterval );
		}
	}

	var monitor = null;

	return function( interval ){
		if(!monitor){
			monitor = new LoadMonitor( interval );
			monitor[__init]();
		}
		return monitor;
	}

}];

function getLoadObject(){
	var loadavg = os.loadavg();
	var lavg1 = loadavg[0];
	var lavg5 = loadavg[1];
	var lavg15 = loadavg[2];
	var freemem = os.freemem();
	var totalmem = os.totalmem();
	var memused = Math.round(( 1 - freemem/totalmem ) * 1000 ) / 10;
	return {
		lavg1: lavg1,
		lavg5: lavg5,
		lavg15: lavg15,
		total: totalmem,
		free: freemem,
		memused: memused
	}
}