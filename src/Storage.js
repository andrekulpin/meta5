const async = require('async');
const _ = require('lodash');
const { once, map } = require('co-dash');

//Merges all the database wrappers in core/db folder with db driver clients
module.exports = [ 'db/', 'connector', function( dbWrappers, Connector ){
	//One function to rule them all...
	const initStorage = once(function*( config ){
		const { databases } = config;
		//INIT CONNECTOR
		const connector = new Connector( databases );
		//FIND VALID DB_CLIENTS
		const dbs = _.intersection( _.keys( dbWrappers ), _.keys( databases ) );
		//MERGE WRAPPERS WITH DRIVERS
		let connectors = yield map( dbs, function*( name ){
			return yield connector.init( name, dbWrappers[ name ] );
		});
		let zipped = _.zipObject( dbs, connectors );
		//shutdown all method
		Object.defineProperty( zipped, 'close', {
			__proto__: null,
			value: function(){
				for(var i in this){
					var client = this[i];
					client && client.end();
				}
				return this;
			}
		});
		return zipped;
	});
	return initStorage;
}];


