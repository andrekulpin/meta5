//const P = require('bluebird')
module.exports = [
	
	'isGreenLight',
	'generateTasks',
	'parseTask',
	'Queue',
	'models/metaparser',

	function*( isGreenLight, generateTasks, parseTask, Queue, db ){
		//initial config load
		let config = yield db.getConfig();
		//queue to handle the concurrency of parsing
		let queue = new Queue( parseTask, config.concurrency );

		return function*(){

			while( true ){
				
				yield isGreenLight( config.cronSchedule );

				let task = yield db.getTask();
				if(!task){
					config = yield db.getConfig();
					console.log('started')
					yield generateTasks( config );
					console.log('finished')
					continue;
				}
				console.log(1)
				yield queue.push( task );
				//yield parseTask({source: 'skyscanner'});
				//yield defer();

			}

		}
	}
]

/*function defer( time ){
	return new P( resolve =>{
		setTimeout( () => resolve(), 2000 );
	})
}*/