const P = require('bluebird');
const _ = require('lodash');
const R = require('ramda');
const Unirest = require('unirest');
const Request = P.promisify(require('request'));
const countries = ["world","open","us-fl","us-il","us-ny","uk","ch","us-dc","sg","nl","de","us-ca"];

module.exports = ['src/utils', 'references', function*( Utils, getReference ){

	let { data: agents } = yield getReference('userAgents');

	class NetUtils extends Utils {

		static customRequest( options ){
			return __requestObj( options );
		}

		static getUserAgent(){
			return _.sample( agents );
		}

		static getProxy( proxies, next ){
			const len = proxies.length - 1;
			const i = next ? Math.min( next, len ) : 0;
			const [ country, session ] = [ _.sample( countries ), _.random( 8 << 8, 8 << 16 ) ];
			return this.renderString( proxies[ i ], { country, session } );
		}

	}

	return NetUtils;

}]

function __requestObj( opts ){
	var fn = fn || __requestObj
	fn.opts = _.merge(fn.opts || {}, opts);
	fn.exec = function(){
		return __execRequest( this.opts );
	}
	return fn;
}

function __execRequest( { url, method, headers, timeout, proxy, body } ){
	return Request({
		url,
		method,
		headers,
		body,
		proxy,
		timeout: timeout || 60000,
		json: true,
		gzip: true
	})
	.then(({ headers, body }) => {
		return { headers, body };
	});
}
//http://lum-customer-onetwotrip-zone-sky-session-147024:st2isitwi509@servercountry-nl.zproxy.luminati.io:22225