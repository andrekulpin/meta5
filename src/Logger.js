const _ = require('lodash');
const moment = require('moment');
const config = require('cluster/config');
const zmq = {}//require('zmq');
const bunyan = require('bunyan');

const levels = {
	60: 'C',
	50: 'E',
	40: 'W',
	30: 'I',
	20: 'D',
	10: 'T'
}

var colors = {
	I: 34,
	E: 31,
	D: 36,
	W: 38,
	C: 37,
	Z: 34
}

class RawStream {
	constructor( socket ){
		this.socket = socket;
	}
	write( rec ){
		if( !_.isObject( rec ) ){
			return console.error('error: raw stream got a non-object record: %j', rec);
		}
		rec['@timestamp'] = new Date();
		rec.levelType = levels[ rec.level ];
		let record = JSON.stringify( rec );
		if(rec.levelType === 'D'){
			record = record.replace( /(\d{4})\d{8}(\d{4})/g, '$1********$2' );
		}
		process.stdout.write( prettyStdout( rec ) + '\n' );
		this.socket.send( record );
	}
}

module.exports = function( __config ){
	__config = __config || config;
	const { addr } = __config['zmq'];
	const socket = zmq.socket('push');
	_.each( addr, ad => socket.connect( ad ));
	const stream = { type: 'raw', stream: new RawStream( socket ) }
	const options = getLogOptions({ name: __config.name, streams: [ stream ] })
	return bunyan.createLogger( getLogOptions( options ));
}

function getLogOptions( options ){
	return {
		name: options.name,
		streams: options.streams
	}
}

function prettyStdout( rec ){
	let type = rec.levelType;
	let color = colors[type];
	let time = moment(rec['@timestamp']).format('YYYY-MM-DD-HH:mm:ss')
	let stamp = '[' + time + ']';
	let pid = '[' + rec.pid + ']';
	let service = '[' + rec.service + ']';
	let msg = ' ' + rec.msg;
	if(color){
		type = '[' + '\033[37;' + color + ';1m' + type + '\033[0m' + ']';
	}
	return [ stamp, type, pid, service, msg ].join('');
}