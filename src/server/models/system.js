module.exports = ['BaseModel', function( BaseModel ){

	class SystemModel extends BaseModel {

		constructor( modelName ){
			super( modelName );
		}

		*getWhitelist(){
			return yield this.redis.get('metaparser_system_whitelist');
		}

		*getUser( user ){
			return yield this.redis.get('metaparser_system_users_' + user);
		}

	}

	return new SystemModel('system');

}]