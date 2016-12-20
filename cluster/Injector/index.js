const types = {'[object Array]': 'array','[object Function]': 'function','[object String]': 'string'}
const __inject = Symbol('__inject');
const __parseName = Symbol('__parseName');
const __findDependency = Symbol('__findDependency');
const __findFactory = Symbol('__findFactory');
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
const { join, basename } = require('path');
const uncast = require('uncast');
const walk = require('co-walk');
const search = require('./search');

//ERROR CONSTANTS
const __UNRESOLVED_ERROR__ = name => 'Too many dependencies found with ' + name;
const __NOT_FOUND_ERROR__ = name => 'Cannot find a module ' + name;

module.exports = function*( root, ignore ){
	const injector = new Injector( root, ignore );
	yield injector.init();
	return injector;
}

class Injector {

	constructor( root, ignoreFiles ){
		this.root = root;
		this.ignore = ignoreFiles;
		this.dependencies = {};
		this.factories = {};
	}
	/*
		inner promise-based injection method;
		in case we have race conditions between dependencies;
		we wrap them in promises
	*/
	[__inject]( factory ){
		const self = this;
		return new P( ( done, err ) => {
			co(function*(){
				var dependencies, args;
				let typeName = getType( factory );
				switch( types[ typeName ] ){
					case 'function':
						dependencies = argsList( factory );
					break;
					case 'array':
						dependencies = factory;
						factory = dependencies.pop();
					break;
					default:
						throw new Error(__UNRESOLVED_ERROR__( factory ));
				}

				args = yield _.map( dependencies, function*( dependency ){
					return yield self.get( dependency );
				});
				
				if( isGenerator(factory) ){
					return done( yield factory( ...args ) );
				}
				return done( factory( ...args ) );
			})
			.catch( err );
		})
	}
	/*
		basic public get method
		escapsulating both inner search method and inject method
	*/
	*get( name ){
		const isPath = name.indexOf('/') > -1;
		const matchAll = name.indexOf('*') > -1;
		if( matchAll ){
			let deps = this[__findDependency]( name, isPath );
			let facs = this[__findFactory]( name, isPath );
			deps = deps && (yield this[__getDeps]( deps ));
			facs = facs && (yield this[__getFacs]( facs ));
			if(!facs && !deps){
				throw new Error(__UNRESOLVED_ERROR__( name ));	
			}
			return _.merge( deps || {}, facs || {} );
		}

		const deps = uncast(this[__findDependency]( name, isPath ));

		if(deps){
			if(_.isArray( deps )){
				throw new Error(__UNRESOLVED_ERROR__( name ));
			}

			const dep = this.dependencies[ deps ];
			
			return isPromise( dep ) ? ( yield dep ) : dep;
		}

		const facs = uncast(this[__findFactory]( name, isPath ));

		if(facs){
			return yield this[__getFacs]( facs );
		}

		throw new Error(__NOT_FOUND_ERROR__( name ));

	}

	register( name, obj ){
		this[ isFactory( obj ) ? 'factories' : 'dependencies' ][ name ] = obj;
	}

	//register the application structure onto an Injector ( dependencies/factories )
	*init(){
		_.each( yield this[__walk]( this.root, this.ignore ), ({ name, module }) => {
			this.register( name, module );
		})
	}

	//load the structure of the application starting from the root folder
	*[__walk]( dir, ignore ){
		let self = this;
		return _.map( yield walk( dir, { ignore } ), file => {
			const path = join(dir, file)
			return {
				name: path,
				module: require( path )
			}
		});
	}

	[__parseName]( key ){
		let base = basename( key, '.js' );
		if( base === 'index' ){
			let _split = key.split('/');
			return _split[ _split.length - 2 ];
		}
		return base;
	}

	[__findDependency]( name, isPath ){
		return search( name, this.dependencies, isPath );
	}

	[__findFactory]( name, isPath ){
		return search( name, this.factories, isPath );
	}

	*[__getDeps]( obj ){
		const self = this;
		if(_.isArray( obj )){
			const mapped = yield co_.map( obj, function*( key ){
				const dep = self.dependencies[ key ];
				return isPromise( dep ) ? ( yield dep ) : dep;
			})
			return _.zipObject( _.map( obj, self[__parseName] ), mapped );
		}
		const dep = self.dependencies[ key ];
		return isPromise( dep ) ? ( yield dep ) : dep;
	}

	*[__getFacs]( obj ){
		const self = this;
		if(_.isArray( obj )){
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
		const factory = this.factories[ obj ];
		self.dependencies[ obj ] = self[__inject]( factory );
		self.dependencies[ obj ] = yield self.dependencies[ obj ];

		delete this.factories[ obj ];
		return this.dependencies[ obj ];
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