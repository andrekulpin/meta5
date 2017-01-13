module.exports = ['jobs/aviaparser/aviaparser', 'CronUtils', 'models/aviaparser', function*( Aviaparser, utils, db ){

	let config = yield db.getConfig();
	const aviaparser = new Aviaparser( config );

	return function*( task ){
		task = task || ( yield aviaparser.getTask() );
		if(!task){
			yield aviaparser.updateConfig();
			return yield aviaparser.generateTasks();
		}
		yield aviaparser.run( task );
	}

}];