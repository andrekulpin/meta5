const _ = require('lodash');
const P = require('bluebird');
const __parseTask = Symbol('__parseTask');

module.exports = [

	'Queue',
	'UniversalFormatter',
	'BestPriceCutter',
	'models/metaparser',
	'aviaparser/utils', 
	'api/avia', 
	'parsers/*.js',

	function( Queue, UniversalFormatter, BestPriceCutter, db, utils, api, Parsers ){

		class Aviaparser {

			constructor( config ){
				this.config = config;
				this.queue = new Queue( this[__parseTask].bind(this), config.concurrency );
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

			*run( task ){
				yield this.queue.push(task);
			}

			*getTask(){
				var rand = Math.random() * 1000;
				return yield stub({
					source: 'skyscanner', from: 'MOW', to: 'LED', dateFrom: '2016-12-27'
				})
				//return yield db.getTask();
			}

			*[__parseTask]( task ){
				let key = utils.getParser( task.source );
				let params = utils.getOTTParams( task );
				let config = this.config.sites[ key ];
				let Parser = Parsers[ key ];
				let parser = new Parser( task, config );
				debugger;
				let data = yield {
					fares: parser.getFares(),
					ottFares: api.getOTTFares( params )
				}
				debugger;
				let { fares, ottFares } = data;
				fares.ottData = ottFares;
				fares.parsingDate = new Date();
				fares.parserMode  = 'auto';
				let obj = {
					data: utils.getOTTDataObj( fares ),
					need: task.source,
					universalFormater: UniversalFormatter,
					BestPricesCutter: BestPriceCutter,
					options: {},
					task: task
				}
				debugger;
				fares = parser.formatFares( obj );
				debugger;
				yield db.saveFares( fares );
			}

			*updateConfig(){
				this.config = yield db.getConfig();
			}

		}

		return Aviaparser;

}]


function stub(n){
	return new P((resolve)=>{
		setTimeout(function(){
			resolve(n)
		}, 2000)
	})
}