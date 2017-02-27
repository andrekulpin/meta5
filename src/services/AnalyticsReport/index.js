const _ = require('lodash');


module.exports = ['BaseService', 'models/analytics', 'CSV', function( BaseService, db, CSV ){

	class AnalyticsReport extends BaseService {

		constructor(){
			super();
		}

		*addStats( type, data ){

			let headers = yield db.getHeaders( type );
			
			headers = JSON.parse(headers);

			const csv = new CSV( headers );

			_.each( data, function( line ){
				csv.addLine( line );
			});

			yield db.addStats( type, csv.end() );
			
		}

	}

	return new AnalyticsReport();

}]