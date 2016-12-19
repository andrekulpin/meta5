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
		if(!this[__pool__]){
			this[__pool__] = this[__driver__].Pool( config || this[__config__] );
			return new P( ( resolve ) => {
				this.client = this[__pool__].connect().then(resolve);
			});
		}


		let client = yield new P((resolve) => {
			return new this[__driver__].Pool( config || this[__config__] )
			.connect()
			.then(resolve);
		})
        return this.client 
            ? _.assign( _.cloneDeep( this ), { client })
            : _.assign( this, { client });
	}

	*get( sql ){
		return this.parse( yield this.client.query( sql ) );
		//return $$timeLimited(this.client.query(sql), this.timeout || params.timeout);
	}

	parse( results ){
		return _.map( results.rows, row => {
			return row;
		});
	}

	end(){
		return this.client.end();
	}


}

module.exports = Vertica;