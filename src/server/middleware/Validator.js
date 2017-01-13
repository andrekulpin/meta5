const { keys, each } = require('lodash');

module.exports = function( handler, params ){
	return function*( ...args ){
		if( !params ){
			return yield handler.apply( this, args );
		}
		const { query } = this.request;
		each( params, ( key )  => {
			if( !query[ key ] ){
				this.throw( 400, 'A param is missing: ' + key );
			}
		});
		yield handler.apply( this, args );
	}
}

