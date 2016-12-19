const R = require('ramda');
const _ = require('lodash');
const path = require('path');

//pipes..
const isEmpty = FN => R.pipe( R.ifElse( R.isEmpty, R.F, FN || R.identity ));
const getKeys2 = R.pipe( R.keys, isEmpty() );
const getKeys = R.pipe( R.keys,	isEmpty() );
const getDepByName = name => R.pipe( R.filter( n => path.basename(n, '.js').toLowerCase() === name ), isEmpty());
const getDepByIndex = name => R.pipe( R.filter( n => _(n).split('/').slice(-2).join('/') === name ), isEmpty());
const getDepByPath = name => R.pipe( R.filter( n => !!~n.toLowerCase().indexOf(name) ), isEmpty());
const getDepByAstrk = ( name, fn ) => R.pipe( getDepByPath( name ), isEmpty( R.pipe( R.filter( fn ), isEmpty())));

const __UNRESOLVED_ERROR__ = name => 'Too many dependencies found with ' + name;

module.exports = function( needle, haystack, isPath ){
	const NAME = _.toLower( needle );
	const PATH = path.join( NAME, 'index.js' );
	//the essential dependency path keys
	let keys = getKeys( haystack );
	if(!keys) return;
	//just module name resolution
	if(!isPath){
		let _keys = getDepByName( NAME )( keys );
		return _keys ? _keys : getDepByIndex( PATH )( keys );
	}
	//module path resolution
	const LAST = _.last( NAME.split('/'));
	const isIndex = needle.indexOf('index') > -1;
	const matchAll = needle.indexOf('*') > -1;
	if( matchAll ){
		const BASE = _.initial(NAME.split('/')).join('/');
		let _keys = getDepByAstrk( BASE, key => {
			const slice = key.slice(key.indexOf( BASE ) + BASE.length + 1);
			const split = slice.split('/');
			return split.length === 1;
		})( keys )
		if(_keys && _keys.length > 1){
			for(let i in _keys){
				let split = _keys[i].split('/');
				if('undefined' === typeof dir){
					var dir = split[ split.indexOf(BASE) - 1 ];
					continue;
				}
				var _dir = split[ split.indexOf(BASE) - 1 ];

				if(dir !== _dir){

					throw new Error(__UNRESOLVED_ERROR__( needle ));
				}
			}
		}
		return _keys;
	}

	keys = getDepByPath( NAME )( keys );
	if(!keys || keys.length === 1 || isIndex) return keys;

	let _keys = getDepByName( LAST )( keys );
	return _keys ? _keys : getDepByPath( PATH )( keys );	

}