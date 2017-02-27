const _ = require('lodash');
const P = require('bluebird');
const __parseTask = Symbol('__parseTask');
const MAP = {
	source: 'source',
	destination: 'to',
	depart_date: 'dateFrom',
	return_date: 'dateTo',
	origin: 'from'
}

module.exports = [
	
	'Queue',
	'NewFormatter',
	'models/aviaparser',
	'aviaparser/utils',
	'api/avia',
	'aviaparser/modules/',
	'BaseService',

	function( Queue, Formatter, db, utils, api, Strategies, BaseService ){

		class Aviaparser extends BaseService {

			constructor( config ){
				super();
				this.config = config;
				this.queue = new Queue( this[__parseTask].bind(this), config.concurrency );
				this.tasks = [];
			}

			*generateTasks(){
				let locked = yield db.setLock();
				if( locked ){
					this.log.info('generateTasks_0');
					let group = yield db.getGroup();
					let active = _.filter( this.config.sites, {'active': true, 'group': +group } );
					let queries = _.map( active, ({ top, query }) => utils.renderString( query, { top }));
					let res = yield db.generateTasks( queries );
					let tasks = unifiyTasks(res);
					yield db.setLockGroupTasks( tasks );
					this.log.info('generateTasks_success', /*tasks.length*/{
						
					});
				}
				yield utils.waitFor( db.getLock.bind( db ));
			}

			*run( task ){
				yield this.queue.push( task );
			}

			*getTask(){
				return yield db.getTask();
			}

			*[__parseTask]( task ){
				this.log.info('parseTask_0', task);
				const key = utils.generateKey( task );
				const name = utils.getParser( task.source );
				const params = utils.getOTTParams( task );
				const config = this.config.sites[ name ];
				const Strategy = Strategies[ name ];
				const parser = new Strategy( task, config );
				try {
					var data = yield {
						fares: parser.getFares(),
						ottFares: api.getOTTFares( params )
					}
					let { fares, ottFares } = data;
					debugger;
					const formatter = new Formatter( task, this.config.csvHeaders );
					const formatted = formatter.merge( fares, ottFares );
					debugger;
					yield db.saveParsedData( key, formatted );
				} catch( err ){
					this.log.error('parseTask_error', err);
					return yield db.saveParsedData( key, 'Parse_error', 10 );
				}
				this.log.info('parseTask_success');
			}

			*updateConfig(){
				this.config = yield db.getConfig();
			}

		}

		return Aviaparser;

}]

function unifiyTasks(tasks){
	return (
		_(tasks)
			.flatten()
			.map( t => _.pick( t, _.keys( MAP )) )
			.map( t => _.mapKeys( t, ( v, k ) => MAP[ k ]) )
			.compact()
			.shuffle()
			.value()
		)
}

function stub(n){
	return new P((resolve)=>{
		setTimeout(function(){
			resolve(n)
		}, 2000)
	})
}