module.exports = ['Aviaparser', 'CronUtils', 'models/metaparser', function*( Aviaparser, utils, db ){

	let config = yield db.getConfig();
	const aviaparser = new Aviaparser( config );

	return function*( task ){
		debugger;
		task = task || ( yield aviaparser.getTask() );
		if(!task){
			yield aviaparser.updateConfig();
			return yield aviaparser.generateTasks();
		}
		debugger;
		yield aviaparser.run( task );
	}

}]