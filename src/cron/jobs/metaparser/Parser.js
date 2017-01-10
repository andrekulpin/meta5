const defer = require('co-defer');
const MIN = 60000;

module.exports = ['strategies/*','models/metaparser', 'utils', function*( Strategies, db, utils ){

	var config = yield db.getConfig('request_config');

	defer.setInterval(function*(){
		config = yield db.getConfig('request_config');
	}, MIN * 10);

	class Parser {

		constructor( name ){
			this.strategy = new Strategies[ name ]( config[ name ] );
		}

		*get( ...args ){
			return yield this.strategy.get( ...args );
		}

		*format( ...args ){
			return yield this.strategy.format( ...args );
		}

	}

	return Parser;

}];