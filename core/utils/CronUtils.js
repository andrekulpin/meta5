const slowMo = require('slow-downer');
const validateTime = require('cron-time-validator');

module.exports = ['Utils', function( Utils ){

	class CronUtils extends Utils {

		*static isGoodTime( cronSchedule ){

			const slow = slowMo(1000, n => Math.min( n + 1000, 60000 ));
			while( !void 69 ){
				if(validateTime( cronSchedule )){ break }
				yield slow();
			}	

		}

	}

}]

//metaparser/cronSchedules