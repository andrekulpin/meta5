const fs = require('fs');

module.exports = [ 'utils', 'models/metaparser', function*( utils, model ){

	return {

		getQueueLength: {
			method: 'get',
			handler: function*(){
				let group = yield model.getGroup();
				this.body = group;
			}
		},

		getConfig: {
			method: 'get',
			handler: function*(){
				let group = yield model.getConfig();
				this.body = group;
			}
		},

		'getConfig.txt': {

			handler: function*(){

			  this.body = fs.createReadStream(__filename, { encoding: 'utf8'});

			}

		},

		getBoy: {
			method: 'get',
			handler: function*(){
				this.body = 'good boy'
			}
		}

	}	

}]