const { EventEmitter } = require('events');

module.exports = ['Logger', function( getLogger ){

	class BaseService extends EventEmitter {

		constructor( service ){
			super();
			this.log = getLogger().child({ service })
		}

	}

	return BaseService;

}]