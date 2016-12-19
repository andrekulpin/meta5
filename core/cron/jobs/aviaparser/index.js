module.exports = ['Aviaparser', 'CronUtils', function*( Aviaparser, utils ){

	const aviaparser = new Aviaparser( 2 );

	return function*(){

		while( true ){

			yield utils.isGoodTime();
			let task = yield aviaparser.getTask();
			if(!task){
				yield aviaparser.generateTasks();
				continue;
			}
			yield aviaparser.run(task);

		}

	}

}]