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
		$$['storage'] = yield initStorage( config );
		$$['server'] = yield initServer( config );
		$$['cron'] = yield initCron( config );
	})
	.catch(function( err ){

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