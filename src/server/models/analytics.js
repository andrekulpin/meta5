module.exports = ['BaseModel', function( BaseModel ){

	class AnalyticsModel extends BaseModel {

		constructor(){
			super();
		}

		*getHeaders( key ){
			return yield this.redis.get( key );
		}

		*addStats( key, data ){
			return yield this.redis.rpush( key, data );
		}

	}

	return new AnalyticsModel();

}]