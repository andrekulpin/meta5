const _ = require('lodash');
const P = require('bluebird');
const qs = require('querystring');

module.exports = ['metaparser/Parser', 'netUtils', 'models/metaparser', function*( Parser, utils, model ){

	const getOttFares = utils.customRequest('https://www.onetwotrip.com/_api/searching/startSyncMetaparser');
	const options = {
		method: 'POST',
		headers: {"Authorization": "Basic " + ( new Buffer('metaparser@12trip:7b4w5JXf') ).toString('base64')},
		body: null
	}

	return function*( task ){

		const name = getParser( task.source );
		options.body = getOTTparams( task );
		const parser = new Parser( name );
		var fares = yield parser.get( task );

		const data =  yield {
			fares: parser.get( task ), 
			ottFares: getOttFares( options )
		}

		console.log(data)
		//console.log(fares)

		yield defer(4000);
	}
}]	

function defer( time ){
	return new P( done => {
		setTimeout( () => done(), time || 5000 );
	})
}

/*metaparser@12trip
7b4w5JXf*/

function getOTTparams(task){
	var depDay   = task.dateFrom.slice(8,10);
	var depMonth = task.dateFrom.slice(5,7);
	var retDay = '';
	var retMonth = '';

	if(task.dateTo){
		retDay   = task.dateTo.slice(8,10);
		retMonth = task.dateTo.slice(5,7);
	}

	return qs.stringify({
		clientId: task.source.split('.')[0],
		route: [depDay, depMonth, task.from, task.to, retDay, retMonth].join(''),
		cs: 'E'
	})
}

function getParser( obj ){
	return obj.indexOf('.') > -1 
		? obj.split('.')[0]
		: obj.split('_');
}