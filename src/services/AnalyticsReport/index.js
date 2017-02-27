const _ = require('lodash');
const prefix = 'vertica_stat_';


module.exports = ['BaseService', 'models/analytics', 'CSV', function( BaseService, db, CSV ){

	class AnalyticsReport extends BaseService {

		constructor(){
			super();
		}

		*addStats( type, data ){

			const key = prefix + type;

			const headers = db.getHeaders( type );
			const csv = new CSV( headers );

			_.each( data, function( line ){
				csv.addLine( line );
			});

			yield db.addStats( key, csv.end() );
			
		}

	}

}]