const { map } = require('lodash');

module.exports = [ 'BaseModel', function( BaseModel ){

	class AviaparserModel extends BaseModel {

		constructor(){
			super();
		}

		*getConfig(){
			return yield this.riak.get('metaparser/aviaparser_config');
			//return yield this.redis.get('metaparser_aviaparser_config');
		}

		*getCodes(){
			return yield this.redis.get('metaparser_aviaparser_skyscannerCityCodes');
		}

		*getGroup(){
			return yield this.redis.get( 'metaparser_aviaparser_group' );
		}

		*insertTask( task ){
			return yield this.redis.lpush( 'metaparser_aviaparser_queue', task );
		}

		*getTask(){
			return yield this.redis.lpop( 'metaparser_aviaparser_queue' );
		}

		*getLock(){
			return yield this.redis.get( 'metaparser_aviaparser_lock' );
		}

		*setLock( time = 5 ){
			return yield this.redis.set( 'metaparser_aviaparser_lock', 1, 'nx', 'ex', time );
		}

		*saveFares(){
			return yield this.redis.set( '' );
		}

		*generateTasks( queries ){
			const client = yield this.vertica.createClient();
			const res = yield map( queries, query => client.get( query ));
			client.end(() => {});
			return res;
		}

		*getWhitelist(){
			return yield this.redis.get('metaparser/aviaparser_config');
		}

		*setLockGroupTasks( tasks, group ){
			return yield this.redis.execBatch(
				{ fn: 'del', key: 'metaparser_aviaparser_lock' },
				{ fn: 'rpush', key: 'metaparser_aviaparser_queue', 'value': tasks },
				{ fn: 'set', key: 'metaparser_group', 'value': group }
			);
		}

		*saveParsedData( key, fares, time = 3600 ){
			return yield this.redis.set( 'metaparser_aviaparser_' + key, fares, 'ex', time );
		}

		*isParseReady( key ){
			return yield this.redis.exists( 'metaparser_aviaparser_' + key );
		}

		getParsedData( key ){
			return this.redis.stream( 'metaparser_aviaparser_' + key );
			//return yield this.redis.get( 'metaparser_avia_' + key );
		}
	}

	return new AviaparserModel();

}]