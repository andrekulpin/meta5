const co = require('co');
const initContainer = require('./container');

exports.init = function( config ){
	co(function*(){

		const container = yield initContainer( config );
		const initStorage = yield container.get('storage');
		/*
			gonna make the storage obj global in case we'd like to quit gracefully,
			shut down all the open client connections in the catch section
		*/
		storage = yield initStorage( config );
		//console.log(container)
		//start resolving all the dependencies of the project
		const [ initServer, initCron ] = yield [ container.get('server'), container.get('cron') ];

		//console.log(container)

		//init sequentially server and then cron
		//yield initServer( config );
		yield initCron( config );
		
		//console.log(container)
		//yield initCron( config );

	})
	.catch(function(err){
		console.log(500)
		console.log(err);
		process.exit(1);
	})
}