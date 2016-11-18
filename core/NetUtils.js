const P = require('bluebird');
const _ = require('lodash');
const R = require('ramda');
const isJson = require('is-json');
const agents = require('core/misc/userAgents');
const Request = P.promisify(require('request'));
const countries = ["world","open","us-fl","us-il","us-ny","uk","ch","us-dc","sg","nl","de","us-ca"];

module.exports = ['utils', function( Utils ){

	class NetUtils extends Utils {

		static customRequest( ...args ){
			return this.__curry( __baseRequest, Object )( ...args );
		}

		static getUserAgent(){
			return _.sample( agents.names );
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

function __baseRequest( { method, headers, body, timeout }, url ){
	return Request({
		url,
		method,
		headers,
		body,
		timeout: timeout || 60000,
		gzip: true
	})
	.then( ({ body, headers }) => {
		return {
			headers,
			body: isJson( body ) ? JSON.parse( body ) : body
		}
	});	
}
