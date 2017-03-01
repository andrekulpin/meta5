const Formatter = require('./src/services/Parser/aviaparser/NewFormatter')[1](function Foo(){})
const CSV = require('./src/services/CSV')[1](function Foo(){})
const fs = require('fs');
const co = require('co');
const _ = require('lodash');

const l = console.log.bind( console )

console.log(Formatter)

var headers = [
 "PARSE_DATE",
  "PARSE_TIME",
  "CLASS",
  "DIRECTION",
  "DEPARTURE",
  "RETURN",
  "CARRIER_FW",
  "CARRIER_BW",
  "FLIGHTS",
  "DIRECT",
  "CHANNEL",
  "AGENT",
  "FICS",
  "FARE",
  "TAXES",
  "COM %",
  "COM ABS",
  "T%",
  "DIS/MAR",
  "NF%",
  "NC%",
  "NT%",
  "SALE",
  "LDIFF",
  "MAX DIFF",
  "NEED DIFF%",
  "NEED DIFF",
  "NNF%",
  "NNC%",
  "NNT%",
  "FAKE/NO FARE",
  "HIDDEN",
  "OTA1",
  "OTA2",
  "OTA3",
  "OTA1N",
  "OTA2N",
  "OTA3N",
  "COUNT",
  "MDM_MARKUP",
  "PMODE",
  "POS_OFFER",
  "CARRIER_FW_VALID",
  "CARRIER_BW_VALID",
  "FLIGHTNUMBERS",
  "OTT_PLACE",
  "OTT_PRICE"
 ];


co(function * (){

	const csv = new CSV( headers )

	const data = yield readFile('./parsedTask.txt');
	const body = JSON.parse( data )
	const formatter = new Formatter({ source: 'skyscanner', from: 'MOW', to: 'LED', dateFrom: '2017-02-15', dateTo: '2017-03-15' });
	const res = formatter.merge( body.fares, body.ottFares );


	//console.log(res)

	_.each(res, r => csv.addLine(r))



	let json = csv.end()

	yield writeFile( 'testo.csv', json )

	//console.log(JSON.stringify(body.fares['S70069-S76596']))

	//const rrr = _.filter( res, r => r.agent )
	//l( res )
	

})
.catch(function( err ){
	console.log( err );
})



function readFile( name ){
	return function( callback ){
		fs.readFile( name, 'utf8', callback );
	}
}

function writeFile( name, data ){
	return function( callback ){
		fs.writeFile( name, data, callback );
	}
}







/*formatter.merge()


console.log(formatter)*/

