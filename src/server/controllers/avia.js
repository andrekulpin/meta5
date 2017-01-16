const fs = require('fs');
const P = require('bluebird');

module.exports = [ 'aviaparser/utils', 'models/aviaparser', 'jobs/aviaparser/index.js', 'api/avia', function*( utils, model, aviaparser, apiAvia ){

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
		},

		'getConfig.txt': {

			handler: function*(){
				this.log.info('getConfig');
			  	this.body = fs.createReadStream(__filename, { encoding: 'utf8'});
			}

		},

		getBoy: {
			method: 'get',
			handler: function*(){
				this.log.info('getBoy');
				this.body = 'jasjdalskjl';
			}
		},

		parseAviaTask: {
			method: 'get',
			persmissions: ['metaparser'],
			params: ['source', 'from', 'to', 'dateFrom'],
			handler: function*(){
				const { source, from, to, dateFrom, dataTo } = this.request.query;
				const task = { source: 'skyscanner', from: 'MOW', to: 'LED', dateFrom: '2017-02-16'};
				const key = utils.generateKey( task );
				yield aviaparser( task );
				while( !( yield model.isParseReady( key ) )){
					yield P.delay( 3000 );
				}
				this.body = model.getParsedData( key );
			}
		}

	}	

}]