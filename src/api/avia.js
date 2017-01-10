const _ = require('lodash');
const qs = require('querystring');

module.exports = ['NetUtils', 'models/api', function*( NetUtils, db ){

	const config = yield db.getConfig();
	const { credentials } = config;
	const { apis } = config;

/*	_.each( config.apis['avia'], ( options, name ) => {
		let hash = ( new Buffer(credentials.username + ':' + credentials.password).toString('base64') );
		options.headers['Authorization'] = hash;
		let request = NetUtils.customRequest({
			url: options.url,
			method: options.method,
			headers: options.headers,
			timeout: options.timeout
		});
		return function*( body ){
			return yield request({ body }).exec();
		}
	});*/

	return {

		*getOTTFares( body ){
			const options = apis[ 'avia' ][ 'getOTTFares' ];
			const hash = ( Buffer.from(credentials.username + ':' + credentials.password).toString('base64') );
			options.headers['Authorization'] += hash;
			options.body = qs.stringify( body );
			const request = NetUtils.customRequest( options );
			const { body: data }  = yield request.exec();
			return data;
		}

	}

}]