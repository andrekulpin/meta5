module.exports = ['CronUtils', 'models/aviasales', function*( utils, db ){

	let config = yield db.getConfig();

	return function*(){

		while( true ){

			yield utils.checkSchedule( config.cronSchedule );


		}

	}

}]