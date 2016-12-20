module.exports = ['Aviaparser', 'CronUtils', 'models/metaparser', function*( Aviaparser, utils, db ){

	let config = yield db.getConfig();
	const aviaparser = new Aviaparser( 2 );

	return function*(){

		while( true ){

			yield utils.checkSchedule( config.cronSchedule );
			let task = yield aviaparser.getTask();
			if(!task){
				yield aviaparser.generateTasks();
				continue;
			}
			yield aviaparser.run(task);

		}

	}

}]