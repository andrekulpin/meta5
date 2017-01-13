const koa = require('koa');
const use = require('koa-use');

module.exports = ['Router', 'Logger', 'Whitelist', 'Errors', function( Router, Logger, Whitelist, Errors ){
	return function*( config ){
		let app = use( koa() );
		app.use([

			Errors(),
			Whitelist(),
			Logger( config ),
			yield Router( config )

		]);
		app.listen( config.port );
		console.log('Server is listening on port ' + config.port + '...');
	}
}];