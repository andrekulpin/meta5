module.exports = ['Aviaparser', 'CronUtils', 'models/metaparser', function*( Aviaparser, utils, db ){

	let config = yield db.getConfig();
	const aviaparser = new Aviaparser( config );

	return function*(){
		let task = yield aviaparser.getTask();
		if(!task){
			yield aviaparser.updateConfig();
			return yield aviaparser.generateTasks();
		}
		yield aviaparser.run( task );
	}

}]