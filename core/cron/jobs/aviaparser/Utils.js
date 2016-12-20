const { find } = require('lodash');

module.exports = ['CronUtils', function( CronUtils ){

	class Utils extends CronUtils {

		static getParser( parsers, name ){
			return find( parsers, ( _, parser ) => {
				return !!~parser.indexOf(name)
			})
		}

	}

	return Utils;

}]