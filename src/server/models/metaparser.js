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

		*saveFares( fares ){
			return yield this.redis.set( 'metaparser_csv', fares, 'ex', 3600 )
		}

	}

	return new MetaparserModel('metaparser');

}]