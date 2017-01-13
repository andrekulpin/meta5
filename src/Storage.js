const config = require('cluster/config');
const _ = require('lodash');
const { once, map } = require('co-dash');

//Merges all the database wrappers in core/db folder with db driver clients
module.exports = [ 'db/', 'connector', function( dbWrappers, Connector ){
	//One function to rule them all...
	const initStorage = once(function*(){
		const { databases } = config;
		//INIT CONNECTOR
		const connector = new Connector( databases );
		//FIND VALID DB_CLIENTS
		const dbs = _.intersection( _.keys( dbWrappers ), _.keys( databases ) );
		//MERGE WRAPPERS WITH DRIVERS
		let connectors = yield map( dbs, function*( name ){
			return yield connector.init( name, dbWrappers[ name ] );
		});
		return _.zipObject( dbs, connectors );
	});
	return initStorage;
}];