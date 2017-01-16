const koa = require('koa');
const use = require('koa-use');
const Session = require('koa-session');

module.exports = ['Router', 'Logger', 'Auth', 'Whitelist', 'Errors', function( Router, Logger, Auth, Whitelist, Errors ){
	return function*( config ){
		let app = use( koa() );
		app.use([

			Errors(),
			Whitelist(),
			Logger( config ),
			Session( app ),
			Auth(),
			yield Router( config )

		]);
		console.log('Server is listening on port ' + config.port + '...');
		return app.listen( config.port );
	}
}];