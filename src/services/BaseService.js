const { EventEmitter } = require('events');

module.exports = ['Logger', function( getLogger ){

	class BaseService extends EventEmitter {

		constructor(){
			super();
			this.log = getLogger().child({service: this.constructor.name })
		}

	}

	return BaseService;

}]