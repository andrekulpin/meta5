const co = require('co');
const P = require('bluebird');
const async = require('async');
const initInjector = require('./Injector');

exports.init = function( config ){
	const $$ = {};
	co(function*(){
		const { coreFolder, ignoreFiles } = config;
		const injector = yield initInjector( coreFolder, ignoreFiles );
		//start resolving all the dependencies of the project
		const [ initStorage, initServer, initLogger, initCron ] = yield [
			injector.get('src/storage'),
			injector.get('src/server'),
			injector.get('src/logger')
			//injector.get('src/cron')
		];
		//init sequentially all services
		$$['logger'] = initLogger( config );
		$$['storage'] = yield initStorage( config );
		$$['server'] = yield initServer( config, $$['logger'] );
		$$['cron'] = yield initCron( config, $$['logger'] );
	})
	.catch(function( err ){

		$$['logger'].error( 'Application crash: ', err );

		async.each( [ 
			$$['server'], 
			$$['storage']
		], ( $, done ) => {
			$.close( done );
		}, () => {
			process.exit(1);
		});

	});
}