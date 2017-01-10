const _ = require('lodash');
const slowDown = require('slow-downer');
const MAP = {
	'origin': 'from',
	'destination': 'to',
	'depart_date': 'dateFrom',
	'return_date': 'dateTo',
	'city': 'from',
	'date_start': 'dateFrom',
	'dateTo': 'date_end',
	'source': 'source'
}

module.exports = [ 'models/metaparser', 'Utils', function( db, utils ){
	return function*( { sites } ){
		//set the semophore-like lock
		let locked = yield db.setLock();
		if( locked ){
			//create vertica client and get parse group
			let parallel = [ db.vertica.createClient(), db.getGroup() ];
			let [ vertica, group ] = yield [ ...parallel ];
			//end vertica on the next tick
			//process.nextTick( () => vertica.end() );
			//filter out all the inactive parsers
			let active = _.filter( sites, {'active': true, 'group': +group } );
			//render sql queries for the vertica client
			let queries = _.map( active, ({ top, query }) => utils.renderString( query, { top }));
			//execute queries
			let res = yield _.map( queries, query => vertica.get( query ));
			vertica.end();
			//parse, filter and shuffle the results
			let tasks = _(res)
			.flatten()
			.map( t => _.pick( t, _.keys( MAP )))
			.map( t => _.mapKeys( t, ( v, k ) => MAP[ k ]))
			.compact()
			.shuffle()
			.value()
			//unset lock, push tasks and change parse group atonomically
			return yield db.setLockGroupTasks( tasks, group );
		}
		yield waitFor( db.getLock.bind( db ) );
	}
}]


function *waitFor( fn ){

	let slow = slowDown(1000, n => Math.min( n + 1000, 60000 ));

	while( !void 'boiiii' ){

		let [ o ] = yield [ fn(), slow ];
		if( o ){ break };

	}

}