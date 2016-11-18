const koa = require('koa');

module.exports = ['Router', function( Router ){

	return function*( config ){

		let app = koa();
		app.use(function *(next) {
		  try {
		    yield next;
		  } catch (err) {
		    this.status = err.status || 500;
		    this.body = err.message;
		    this.app.emit('error', err, this);
		  }
		})

		app.use( yield Router( config ) );

		app.listen( config.port );
		console.log('Server is listening on port ' + config.port + '...');
	}

}]
/*
'Router', 'jobs/*', 'server/models'

'server/Router'*/