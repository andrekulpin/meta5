const { map } = require('lodash');

module.exports = [ 'BaseModel', function( BaseModel ){

	class MetaparserModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getConfig(){

			return yield this.riak.get('metaparser/aviaparser_config');

		}

		*getCodes(){

			return yield this.riak.get('metaparser/skyscannerCityCodes');

		}

		*getGroup(){

			return yield this.redis.get( 'metaparser_group' );

		}

		*getTask(){

			return yield this.redis.lpop( 'metaparser_queue' );

		}

		*getLock(){

			return yield this.redis.get( 'metaparser_lock' );

		}

		*setLock( secs = 5 ){

			return yield this.redis.set( 'metaparser_lock', 1, 'nx', 'ex', secs );

		}

		*saveFares(){
			return yield this.redis.set( '' );
		}

		*generateTasks( queries ){
			let client = yield this.vertica.createClient();
			return map( queries, query => client.get( query ));
		}

		*setLockGroupTasks( tasks, group ){
			return yield this.redis.execBatch(
				{ fn: 'del', key: 'metaparser_lock' },
				{ fn: 'rpush', key: 'metaparser_queue', 'value': tasks }//,
				//{ fn: 'set', key: 'metaparser_group', 'value': group }
			);
		}

		*saveParsedData( key, fares ){
			return yield this.redis.set( 'metaparser_avia_' + key, fares, 'ex', 3600 );
		}

		*isParseReady( key ){
			return yield this.redis.exists( 'metaparser_avia_' + key );
		}

		getParsedData( key ){
			return this.redis.stream( 'metaparser_avia_' + key );
			//return yield this.redis.get( 'metaparser_avia_' + key );
		}

	}

	return new MetaparserModel( 'metaparser' );

}]