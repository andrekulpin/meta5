const fs = require('fs');
const P = require('bluebird');

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
		},

		'getConfig.txt': {

			handler: function*(){
				this.log.info('getConfig');
			  	this.body = fs.createReadStream( __filename, { encoding: 'utf8'} );
			}

		},

		getBoy: {
			method: 'get',
			handler: function*(){
				this.log.info('getBoy');
				this.body = 'jasjdalskjl';
			}
		},


		//metaparser/avia/parseTask
/*		dashboard: function * (){

			this.body = 

		},*/

		//metaparser/avia/parseTask
		parseTask: {
			method: 'get',
			persmissions: ['metaparser'],
			params: ['source', 'from', 'to', 'dateFrom'],
			handler: function*(){
				const task = this.request.query;
				//const task = { source: 'skyscanner', from: 'MOW', to: 'LED', dateFrom: '2017-02-16'};
				const key = utils.generateKey( task );
				task.mode = task.mode || 'manual';
				yield model.insertTask( task );
				while( !( yield model.isParseReady( key ) )){
					yield P.delay( 3000 );
				}
				this.body = model.getParsedData( key );
			}
		}

	}	

}]
