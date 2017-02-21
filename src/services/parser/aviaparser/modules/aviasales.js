const diesel = require('diesel-js');
const _ = require('lodash');

module.exports = ['BaseService', function(BaseService){
	class AviasalesParser extends BaseService {
		constructor(task, config){
			super();
			this.task = task;
			this.config = config;
		}

		*getFares(){
			yield ( 
				diesel()
				.goto()
				.evaluate()
				.end()
			)

		}

		formatFares(){

		}
	}

	return AviasalesParser;
}]