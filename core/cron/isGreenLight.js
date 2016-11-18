const slowDown = require('slow-downer');
const isGoodTime = require('cron-time-validator');
const CONF = 'metaparser/config';

module.exports = ['BaseModel', function( BaseModel ){

	let db = new BaseModel;

	return function*( cronSchedule ){

		let slowwww = slowDown(1000, n => Math.min( n + 1000, 60000 ));

		while( !void 56829409931131031827041483138 ){
			if(isGoodTime( cronSchedule) ){ break };
			let ___ = [ db.get( CONF ), slowwww() ];
			[ { cronSchedule } ] = yield [ ...___ ];
		}

	}

}]