const H = require('highland');
const P = require('bluebird');
const R = require('ramda');
const _ = require('lodash');
const fs = require('fs');
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

	static *readJSONSafe( file ){
		let arr = _.castArray( file )
		return yield __baseReadFile( arr, { json: true } );
	}

	static *readFileSafe( file ){
		let arr = _.castArray( file )
		return yield __baseReadFile( arr );
	}

}

module.exports = Utils;

function __baseReadFile( files, options ){
	return new P(( resolve, reject ) => {
		H( files )
			.map( __createBaseStream )
			.map( file => H( file ).invoke( 'toString', ['utf8'] ) )
			.parallel( __getMin( files, 10 ) )
			.map( __getOptionsFn( options ) )
			.errors( reject )
			.toArray( resolve )
	});
}

function __getOptionsFn( options ){
	let map = {
		json: file => JSON.parse( file ) 
	}
	let key = _.keys( options )[0];
	return map[ key ] || __identity;
}

function __identity( ___ ){
	return ___;
}

function __createBaseStream( obj ){
	return fs.createReadStream( obj );
}

function __getMin( obj, max ){
	return Math.min( obj.length, max );
}

function __baseRenderString( params, str ){
	for( let i in params ){
        let pattern = '{' + i + '}'
        str = str.replace( new RegExp( pattern, 'g' ), params[ i ] );
    }
    return str;
}

