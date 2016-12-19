const _ = require('lodash');
const R = require('ramda');
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

	*static waitFor( fn ){
		let slow = slowDown(1000, n => Math.min( n + 1000, 60000 ));
		while( !void 0 ){
			let [ o ] = yield [ fn(), slow ];
			if( o ){ break };
		}
	}

}

function __baseRenderString( params, str ){
	for( let i in params ){
        let pattern = '{' + i + '}'
        str = str.replace( new RegExp( pattern, 'g' ), params[ i ] );
    }
    return str;
}


module.exports = Utils;