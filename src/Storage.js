const config = require('cluster/config');
const async = require('async');
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
		let zipped = _.zipObject( dbs, connectors );
		//shutdown all method

		Object.defineProperty( zipped, 'close', {
			__proto__: null,
			value: function( callback ){
				let exits = [];
				for(var i in this){
					let client = this[i];
					exits.push(client.end.bind(client));
				}
				async.parallel( exits, callback );
			}
		});

		return zipped;

	});

	return initStorage;
}];


function asyncify( fn ){
	return function( ...args ){
		var callback = args.pop();
		var err;
		var res;
		try{
			res = fn();	
		} catch( err ){
			err = err;
		}
		callback(err, res);
	}
}


