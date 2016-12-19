const _ = require('lodash');
const __parseTask = Symbol('__parseTask');

module.exports = ['Queue', 'models/metaparser', 'Utils', function( Queue, db, utils ){

	class Aviaparser {

		constructor( concurrency ){
			this.queue = new Queue( this[__parseTask], concurrency );
			this.tasks = [];
		}

		*generateTasks(){
			let locked = yield db.setLock();
			if( locked ){
				let group = yield db.getGroup()
				let active = _.filter( sites, {'active': true, 'group': +group } );
				let queries = _.map( active, ({ top, query }) => utils.renderString( query, { top }));
				let res = yield db.generateTasks( queries );
				let tasks = _(res)
				.flatten()
				.map( t => _.pick( t, _.keys( MAP )))
				.map( t => _.mapKeys( t, ( v, k ) => MAP[ k ]))
				.compact()
				.shuffle()
				.value()

			}
			yield utils.waitFor( db.getLock.bind( db ));
		}

		run( task ){
			yield this.queue.push(task);
		}

		*getTask(){
			return yield db.getTask();
		}

		[__parseTask]( task ){



		}

	}

	return Aviaparser;

}]
