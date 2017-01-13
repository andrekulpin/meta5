const whitelist = require('koa-ip');

module.exports = ['models/system', function*( model ){

	const { whitelist: ips } = yield model.getWhitelist();

	return function(){
		return whitelist( ips );
	}

}];