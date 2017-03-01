const co = require('co');
const initInjector = require('./Injector');

exports.init = function( config ){
	const app = {};
	co(function*(){
		const { coreFolder, ignoreFiles } = config;
		const injector = yield initInjector( coreFolder, ignoreFiles );
		//start resolving all the dependencies of the project
		const [ initStorage, initServer, initLogger, initCron ] = yield [
			injector.get('src/storage'),
			injector.get('src/server'),
			injector.get('src/logger'),
			injector.get('src/cron')
		];
		//init sequentially all services
		app['storage'] = yield initStorage( config );
		app['server'] = yield initServer( config );
		app['logger'] = initLogger( config ).child({service: 'Worker'});
		app['cron'] = yield initCron( config );
	})
	.catch( err => {
		gracefulExit(app, err);
	});
	process.on('uncaughtException', ( err ) => {
		gracefulExit(app, err);
	});
}

function gracefulExit( app, err ){
	app['logger'].error(`Critical crash: ${err}`);
	app['server'].close();
	app['storage'].close();
	process.exit( 1 );
}