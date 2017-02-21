module.exports = ['BaseModel', function( BaseModel ){

	class StatisticsModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*addStats( key, data ){
			return yield this.redis.rpush( key, data );
		}

	}

	return new StatisticsModel('statistics');

}]