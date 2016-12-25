module.exports = ['BaseModel', function( BaseModel ){

	class ApiModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getConfig(){
			return yield this.riak.get('metaparser/api_config');
		}

	}

	return new ApiModel('api');

}]