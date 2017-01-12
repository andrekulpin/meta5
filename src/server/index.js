const koa = require('koa');

module.exports = ['Router', 'Logger', function( Router, Logger ){
	return function*( config ){
		let app = koa();
		app.use( Logger( config ) );
		app.use(function *(){
			debugger;
		})
		app.use( yield Router( config ) );
		app.listen( config.port );
		console.log('Server is listening on port ' + config.port + '...');
	}
}]
/*
'Router', 'jobs/*', 'server/models'

'server/Router'*/

/*app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  }
})*/