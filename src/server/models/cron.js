module.exports = ['BaseModel', function( BaseModel ){

	class CronModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getConfig(){
			return yield this.redis.get('metaparser_cron_config');
		}

	}

	return new CronModel('cron');

}]