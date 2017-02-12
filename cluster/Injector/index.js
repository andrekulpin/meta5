const types = {'[object Array]': 'array','[object Function]': 'function','[object String]': 'string'}
const __inject = Symbol('__inject');
const __parseName = Symbol('__parseName');
const __find = Symbol('__find');
const __getFacs = Symbol('__getFacs');
const __getDeps = Symbol('__getDeps');
const __walk = Symbol('__walk');
const _ = require('lodash');
const R = require('ramda');
const P = require('bluebird');
const co = require('co');
const co_ = require('co-dash');
const argsList = require('args-list');
const { readdir, stat } = require('co-fs');
const path = require('path');
const uncast = require('uncast');
const walk = require('co-walk');
const search = require('./search');

//ERROR CONSTANTS
const __UNRESOLVED_ERROR__ = name => 'Unresolved dependencies: ' + name;
const __NOT_FOUND_ERROR__ = name => 'Cannot find a module ' + name;

module.exports = function*( root, ignoreFiles ){
	const injector = new Injector( root, ignoreFiles );
	yield injector.init();
	return injector;
}

class Injector {
	constructor( root, ignoreFiles ){
		this.root = root;
		this.ignore = ignoreFiles;
		this.dependencies = {};
		this.factories = {};
		this.collection = [];
	}
	/*
		inner promise-based injection method;
		in case we have race conditions between dependencies;
		we wrap them in promises
	*/
	[__inject]( factory, relativeDir ){
		const self = this;
		return new P( ( done, reject ) => {
			co(function*(){
				var dependencies, args;
				let typeName = getType( factory );
				switch( types[ typeName ] ){
					case 'function':
						dependencies = argsList( factory );
					break;
					case 'array':
						dependencies = factory.slice();
						factory = dependencies.pop();
					break;
					default:
						throw new Error(__UNRESOLVED_ERROR__( factory ));
				}
				args = yield _.map( dependencies, function*( dependency ){
					return yield self.get( dependency, relativeDir );
				});
				let fac;
				if( isGenerator(factory) ){
					try{
						fac = yield factory( ...args )
					} catch( err ){
						throw new Error( err );
					}
					return done( fac );
				}
				try{
					fac = factory( ...args )
				} catch( err ){
					throw new Error( err );	
				}
				return done( fac );
			})
			.catch( reject );
		})
	}
	/*
		basic public get method
		escapsulating both inner search method and inject method
	*/
	*get( name, relativeDir ){
		const matchAll = name.indexOf('*') > -1;
		const isFolder = name[name.length - 1] === '/';
		const isLocal = name.indexOf('./') > -1;
		if(isLocal){
			name = path.resolve(relativeDir, name);
		}
		if( matchAll || isFolder ){
			const keys = this[__find]( name );
			let [ deps, facs ] = _.partition( keys, key => this.dependencies[ key ] );
			deps = deps && ( yield this[__getDeps]( deps ));
			facs = facs && ( yield this[__getFacs]( facs ));
			if(!facs && !deps){
				throw new Error(__UNRESOLVED_ERROR__( name ));
			}
			return _.merge( deps || {}, facs || {} );
		}

		const key = uncast( this[__find]( name ) );

		if(_.isArray( key )){
			if(!key.length){
				throw new Error(__NOT_FOUND_ERROR__( name ));
			}
			throw new Error(__UNRESOLVED_ERROR__( name ));
		}

		let found;

		if( found = this.dependencies[ key ] ){
			return isPromise( found ) ? ( yield found ) : found;
		}
 
		if( found = this.factories[ key ] ){
			const { dir } = path.parse( key );
			this.dependencies[ key ] = this[__inject]( found, dir );
			this.dependencies[ key ] = yield this.dependencies[ key ];
			delete this.factories[ key ];
			return this.dependencies[ key ];
		}

		throw new Error(__NOT_FOUND_ERROR__( name ));

	}
	register( name, obj ){
		this[ isFactory( obj ) ? 'factories' : 'dependencies' ][ name ] = obj;
		this.collection.push( name );
	}
	//register the application structure onto an Injector ( dependencies/factories )
	*init(){
		_.each( yield this[__walk]( this.root, this.ignore ), ({ name, module }) => {
			this.register( name, module );
		})
	}
	//load the structure of the application starting from the root folder
	*[__walk]( root, ignore ){
		return _.map( yield walk( root, { ignore } ), file => {
			const filePath = path.join(root, file)
			return {
				name: filePath,
				module: require( filePath )
			}
		});
	}
	[__parseName]( key ){
		let base = path.basename( key, '.js' );
		if( base === 'index' ){
			let _split = key.split('/');
			return _split[ _split.length - 2 ];
		}
		return base;
	}
	[__find]( name ){
		return search( name, this.collection );
	}
	*[__getDeps]( obj ){
		const self = this;
		const mapped = yield co_.map( obj, function*( key ){
			const dep = self.dependencies[ key ];
			return isPromise( dep ) ? ( yield dep ) : dep;
		})
		return _.zipObject( _.map( obj, self[__parseName] ), mapped );
	}
	*[__getFacs]( obj ){
		const self = this;
		return _.zipObject(
			_.map( obj, this[__parseName] ),
			yield co_.map(obj, function*( key ){
				const factory = self.factories[ key ];
				self.dependencies[ key ] = self[__inject]( factory );
				self.dependencies[ key ] = yield self.dependencies[ key ];
				delete self.factories[ key ];
				return self.dependencies[ key ];
			})
		)
	}
}

function isPromise( obj ){
	return obj && obj['then'];
}

function isFactory( obj ){
	return _.isArray( obj ) && obj.length > 1 && typeof _.last( obj ) === 'function';
}

function isGenerator( fn ){
	let constructor = fn && fn.constructor;
	if(!constructor) return false;
	return constructor.name === 'GeneratorFunction' || 'GeneratorFunction' === constructor.displayName;
}

function getType( obj ){
	return Object.prototype.toString.call( obj );
}