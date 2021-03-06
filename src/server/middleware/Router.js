const kroute = require('kroute');
const { join } = require('path');
const _ = require('lodash');

//import all the controllers in the server/controllers folder
module.exports = [ 'controllers/', 'Validator', function( controllers, $validator ){
	return function*( config ){
		let { mainMethod, mainUrl } = config;
		let router = kroute();
		//hook up all the controllers
		_.each( controllers, ( controller, ctrl ) => {
			_.each( controller, ( value , name ) => {
				var { handler, method, params } = value;
				handler = handler ? _.isFunction( value ) && value : function(){};
				let url = join( '/', mainUrl, ctrl, _.toLower( name ));
				router[ method || mainMethod ]( url, $validator( handler, params ));
			});
		});
		return router;
	}
}]