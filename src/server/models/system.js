module.exports = ['BaseModel', function( BaseModel ){

	class SystemModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getWhitelist(){
			return yield this.riak.get('metaparser/system_whitelist');
		}

	}

	return new SystemModel('system');

}]