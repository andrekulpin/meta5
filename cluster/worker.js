const co = require('co');
const initInjector = require('./Injector');

exports.init = function( config ){
	co(function*(){
		const { coreFolder, ignoreFolders } = config;
		const injector = yield initInjector( coreFolder, ignoreFolders );
		//const initStorage = yield injector.get('storage');
		/*
			gonna make the storage obj global in case we'd like to quit gracefully,
			shut down all the open client connections in the catch section
		*/
		//start resolving all the dependencies of the project
		const [ initStorage, initServer, initCron ] = yield [ 
			injector.get('storage'),
			injector.get('server'),
			injector.get('cron')
		];
		//init sequentially server and then cron
		//yield initServer( config );
		console.log(33333)
		storage = yield initStorage( config );
		yield initCron( config );
	})
	.catch(function(err){
		console.log(500)
		console.log(err);
		process.exit(1);
	})
}