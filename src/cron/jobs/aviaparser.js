const P = require('bluebird');

module.exports = ['services/parser/aviaparser', 'CronUtils', 'models/aviaparser', function*( Aviaparser, utils, db ){

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

}];

function stub(n){
	return new P((resolve) => {
		setTimeout(function(){
			resolve(n)
		}, 2000)
	})
}