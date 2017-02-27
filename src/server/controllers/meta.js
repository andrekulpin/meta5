const fs = require('fs');
const P = require('bluebird');

//metainformation about the system

module.exports = [ 'aviaparser/utils', 'models/aviaparser', 'api/avia', function*( utils, model, apiAvia ){

	return {

		getQueueLength: {
			method: 'get',
			params: ['group'],
			handler: function*(){
				this.log.info('getQueueLength');
				let group = yield model.getGroup();
				this.body = 'group';
			}
		},

		getConfig: {
			method: 'get',
			handler: function*(){
				this.log.info('getConfig');
				let group = yield model.getConfig();
				this.body = group;
			}
		}

	}	

}]