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
	'UniversalFormatter',
	'BestPriceCutter',
	'models/aviaparser',
	'aviaparser/utils',
	'api/avia',
	'aviaparser/modules/',
	'BaseService',

	function( Queue, UniversalFormatter, BestPriceCutter, db, utils, api, Parsers, BaseService ){

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
				const Parser = Parsers[ name ];
				const parser = new Parser( task, config );
				try {
					var data = yield {
						fares: parser.getFares(),
						ottFares: api.getOTTFares( params )
					}
					let { fares, ottFares } = data;
					let _data = {};
					_data.fares = fares;
					_data.ottData = ottFares;
					_data.parsingDate = new Date();
					_data.parserMode  = 'auto';
					let obj = {
						data: utils.getOTTDataObj( _data ),
						need: task.source,
						universalFormater: UniversalFormatter,
						BestPricesCutter: BestPriceCutter,
						options: {},
						task: task
					}
					fares = yield parser.formatFares( obj );
					yield db.saveParsedData( key, fares );
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
		.map( t => _.pick( t, _.keys( MAP )))
		.map( t => _.mapKeys( t, ( v, k ) => MAP[ k ]))
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