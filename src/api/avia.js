const _ = require('lodash');
const qs = require('querystring');
const { join } = require('path');

module.exports = ['NetUtils', 'models/api', 'SystemUpdater', function*( NetUtils, db, initUpdater ){

	var config = yield db.getConfig();
	
	const updater = initUpdater( db.getConfig.bind(db) );
	updater.on('updated', data => {
		config = data.config;
	});

	return {

		*auth( body ){
			const options = config.methods['auth'];
			options.body = qs.stringify( body );
			const request = NetUtils.customRequest( options );
			const { body: data }  = yield request.exec();
			return data;
		},

		*getOTTFares( body ){
			const options = config.methods['getOTTFares'];
			options.headers['Authorization'] += getHash(config.creds);
			options.body = qs.stringify( body );
			const request = NetUtils.customRequest( options );
			const { body: data }  = yield request.exec();
			return data;
		}

	}

}]

function getHash( creds ){
	return Buffer.from(creds.username + ':' + creds.password).toString('base64');
}

