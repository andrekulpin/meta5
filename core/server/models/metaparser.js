module.exports = [ 'BaseModel', function( BaseModel ){

	class MetaparserModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getConfig( type ){

			type = type || 'config';
			return yield this.riak.get('metaparser/' + type);

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

		*setLockGroupTasks( tasks, group ){
			return yield this.redis.execBatch(
				{ fn: 'del', key: 'metaparser_lock' },
				{ fn: 'rpush', key: 'metaparser_queue', 'value': tasks }//,
				//{ fn: 'set', key: 'metaparser_group', 'value': group }
			);
		}

	}

	return new MetaparserModel('metaparser');

}]