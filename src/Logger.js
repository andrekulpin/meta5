const _ = require('lodash');
const uuid = require('node-uuid').v4;
const zmq = require('zmq');
const bunyan = require('bunyan');

const levels = {
	60: 'C',
	50: 'E',
	40: 'W',
	30: 'I',
	20: 'D',
	10: 'T'
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
		process.stdout.write( record + '\n' );
		this.socket.send( record );
	}
}

module.exports = function( config ){
	const { addr } = config.zmq;
	const socket = zmq.socket('push');
	_.each( addr, ad => socket.connect( ad ));
	const stream = { type: 'raw', stream: new RawStream( socket ) }
	const options = getLogOptions({ name: config.name, streams: [ stream ] })
	const log = bunyan.createLogger( getLogOptions( options ));
	return function*( next ){
		const requestId = uuid();
		this.log = log.child({ requestId });
		yield next;
	}
}

function getLogOptions( options ){
	return {
		name: options.name,
		streams: options.streams
	}
}