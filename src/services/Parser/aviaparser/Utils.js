const { find } = require('lodash');
const moment = require('moment');

module.exports = ['CronUtils', function( CronUtils ){

	class Utils extends CronUtils {

		static getParser( name ){
			let [ dash, dot ] = [ !!~name.indexOf('_'), !!~name.indexOf('.') ];
			return dash || dot 
				? dash 
					? name.indexOf('_')[1]
					: name.indexOf('.')[1]
				: name;
		}

		static getOTTParams( { source, from, to, dateFrom, dateTo  } ){
			let clientId = this.getParser( source )
			let dateOne = moment( dateFrom, 'YYYY-MM-DD' ).format('DDMM');
			let dateTwo = dateTo ? moment( dateTo, 'YYYY-MM-DD' ).format('DDMM') : '';
			let route = dateOne + from + to + dateTwo;
			return {
				clientId,
				route,
				cs: 'E'
			}
		}

		static generateKey({ source, from, to, dateFrom, dateTo }){
			return [ source, from, to, dateFrom, dateTo ].join('_');
		}

	}

	return Utils;

}]