const config = require('cluster/config');
const { each } = require('lodash');

module.exports = [ 'storage', function*( getStorage ){
	//get a cached connection...
	let storage = yield getStorage( config );
	
	class BaseModel {

		constructor(){
			this.modelName = this.constructor.name;
			each( storage, ( db, name ) => this[ name ] = db );
		}

		*get( key, db ){
			return yield this[ db || config.mainDb ].get( key );
		}

		*set( key, value, db ){
			return yield this[ db || config.mainDb ].set( key, value );
		}
	}

	return BaseModel;
}]