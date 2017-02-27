module.exports = ['BaseModel', function( BaseModel ){

	class ApiModel extends BaseModel {

		constructor(){
			super();
		}

		*getConfig(){
			return yield this.redis.get('metaparser_api_config');
		}

	}

	return new ApiModel();

}]