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
				yield this.queue.push( task );
			}

			*getTask(){
				var rand = Math.random() * 1000;
				return yield stub({
					source: 'skyscanner', from: 'MOW', to: 'LED', dateFrom: '2017-02-16'
				})
				//return yield db.getTask();
			}

			*[__parseTask]( task ){
				const key = utils.generateKey( task );
				const name = utils.getParser( task.source );
				const params = utils.getOTTParams( task );
				const config = this.config.sites[ name ];
				const Parser = Parsers[ name ];
				const parser = new Parser( task, config );
				let data = yield {
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