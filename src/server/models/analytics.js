module.exports = ['BaseModel', function( BaseModel ){

	class AnalyticsModel extends BaseModel {

		constructor(){
			super();
		}

		*getHeaders( key ){
			return yield this.redis.hget( 'metaparser_analytics', key );
		}

		*addStats( key, data ){
			return yield this.redis.rpush( 'vertica_stat_' + key, data );
		}

	}
	//singleton
	return new AnalyticsModel();

}]