const P = require('bluebird');
const riak = require('basho-riak-client');
const redis = P.promisifyAll(require('redis'));
const vertica = require('pg');

module.exports = function( databases ){

	class Connector {

		constructor(){
			this.driver = {
				riak,
				redis,
				vertica
			};
		}

		*init( name, Wrapper ){
			let { autoConnect, config } = databases[ name ];
			//create db wrapper with the corresponding driver
			let wrapper = new Wrapper( this.driver[ name ], config );
			//return either a client or a wrapped driver
			return autoConnect ? wrapper.createClient() : wrapper;
		}

	}

	return new Connector();

}
