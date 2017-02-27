/*const redis = require('redis');
const riakDriver = require('basho-riak-client');
const Riak = require('./src/db/riak');
const co = require('co');
const P = require('bluebird');

var redisClient = P.promisifyAll(redis.RedisClient.prototype);

redisClient = redis.createClient()

const riakClient = new Riak( riakDriver, { host: ["127.0.0.1:8087"] } );
co(function * (){

	const clientRiak = riakClient.createClient();

	const data = yield clientRiak.keys('metaparser');
	const keys = data.keys;
	let key = null

	while( key = keys.shift() ){

		var info = yield clientRiak.get('metaparser/' + 'skyscannerCityCodes');
		console.log('metaparser_' + key)
		console.log(typeof info)
		yield redisClient.setAsync('metaparser_aviaparser_skyscannerCityCodes', JSON.stringify(info) );
		break;
		var iii = yield redisClient.getAsync( 'metaparser_' + key);
	
		console.log( iii );

	}

	console.log('$ok');

})
.catch(function( err ){

	console.log( err );

});*/


/*client.set('metaparser_aviaparser_config', data, function(err, data){
	//var json = JSON.parse(data)
	console.log(data)
})*/