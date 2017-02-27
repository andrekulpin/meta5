const fs = require('fs');
const P = require('bluebird');

//metainformation about the system

module.exports = [ 'aviaparser/utils', 'models/analytics', function*( utils, model ){

	return {

		aa: function(){

		},
		//metaparser/analytics/getresults
		getresults: {
			method: 'get',
			handler: function*(){
				this.log.info('getresults');
				this.body = 'pussy';
			}
		}

	}	

}]