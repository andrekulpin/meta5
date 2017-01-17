const _ = require('lodash');
const defer = require('co-defer');
const { each } = require('co-dash');

module.exports = ['jobs/**', 'CronUtils', 'models/cron', 'system_updater', function( jobs, utils, db, initUpdater ){
	return function*( config ){
		//Initiates all the crons
		let { crons } = yield db.getConfig();

		const updater = initUpdater([ db.getConfig.bind( db ) ])
		updater.on('update', data => {
			crons = data.crons;
		});

		yield each( jobs, function*( jobInit, jobName ){

			while( true ){

				let cron = _.find( crons, { 'name': jobName, 'active': true } );
				if( !cron ){ break; }
				yield utils.checkSchedule( cron.schedule );
				yield jobInit();

			}

		});
	}
}]