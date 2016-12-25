module.exports = ['BaseModel', function( BaseModel ){

	class CronModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getConfig(){
			return yield this.riak.get('metaparser/cron_config');
		}

	}

	return new CronModel('cron');

}]