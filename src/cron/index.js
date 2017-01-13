const _ = require('lodash');
const defer = require('co-defer');
const { each } = require('co-dash');

module.exports = ['jobs/*/index', 'CronUtils', 'models/cron', function( jobs, utils, db ){
	return function*( config ){
		//Initiates all the crons
		let { crons } = yield db.getConfig();

		defer.setInterval(function*(){
			crons = ( yield db.getConfig() ).crons;
		}, config.systemUpdateInterval );

		yield each( jobs, function*( jobInit, jobName ){

			while( true ){

				let cron = _.find( crons, { 'name': jobName, 'active': true } );
				if( !cron ){ break; }
				yield utils.checkSchedule( cron.schedule );
				yield jobInit();

			}

		});

		//yield each( jobs, initJob => initJob );
	}
}]