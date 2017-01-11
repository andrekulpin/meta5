const H = require('highland');
const P = require('bluebird');
const R = require('ramda');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const slowDown = require('slow-downer');

class Utils {

	static renderString( ...args ){
		return this.__curry( __baseRenderString, Object )( ...args );
	}

	static __curry( fn, type ){
		return function( ...args ){
			if( args && R.is( type, args[0] ) ){
				return _.curry( fn )( ...args );
			}
			return _.curryRight( fn )( ..._.reverse( args ) );
		}	
	}

	static *waitFor( fn ){
		let slow = slowDown(1000, n => Math.min( n + 1000, 60000 ));
		while( !void 0 ){
			let [ o ] = yield [ fn(), slow ];
			if( o ){ break };
		}
	}

	static *readFileSafe( file ){
		let stream = __baseCreateStream( file );
		return yield __baseReadFile( stream );
	}


}

module.exports = Utils;

function __baseReadFile( stream ){
	return new P(( resolve, reject ) => {
		const data = [];
		stream.on('data', buf => {
			data.push(buf);
		})
		stream.on('end', () => {
			const json = JSON.parse( Buffer.concat( data ));
			resolve( json );
		})
		stream.on('error', reject);
	});
}

function __identity( ___ ){
	return ___;
}

function __baseCreateStream( obj ){
	return fs.createReadStream( obj );
}

function __baseRenderString( params, str ){
	for( let i in params ){
        let pattern = '{' + i + '}'
        str = str.replace( new RegExp( pattern, 'g' ), params[ i ] );
    }
    return str;
}

