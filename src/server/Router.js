const kroute = require('kroute');
const { join } = require('path');
const _ = require('lodash');

//import all the controllers in the server/controllers folder
module.exports = [ 'controllers/**', function( controllers ){
	return function*( config ){
		let { mainMethod, mainUrl } = config;
		let router = kroute();
		//hook up all the controllers
		_.each( controllers, ( controller ) => {
			_.each( controller, ({ method, handler }, name ) => {
				let url = join( '/', mainUrl, _.toLower( name ));
				router[ method || mainMethod ]( url, handler );
			});
		});

		router['get']('/', function*(){
			this.body = "hello there";
		});

		return router;
	}
}]