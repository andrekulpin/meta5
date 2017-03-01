const _ = require('lodash');
const __config__ = Symbol('__config__');
const __driver__ = Symbol('__driver__');
const __pool__ = Symbol('__pool__');
const P = require('bluebird');

class Vertica {

	constructor( driver, config ){
		this[__driver__] = driver;
		this[__config__] = config;
	}

	*createClient( config ){
		let client = yield new P(( resolve, reject ) => {
			return new this[__driver__].Pool( config || this[__config__] )
			.connect()
			.then( resolve )
			.catch( reject );
		})
        return this.client 
            ? _.assign( _.cloneDeep( this ), { client })
            : _.assign( this, { client });
	}

	*get( sql ){
		return this.parse( yield this.client.query( sql ) );
	}

	parse( results ){
		return _.map( results.rows, row => {
			return row;
		});
	}

	end( callback ){
		return this.client 
		&& this.client.end( callback );
	}


}

module.exports = Vertica;