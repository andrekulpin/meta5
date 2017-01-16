const _ = require('lodash');
const streamify = require('redis-rstream');
const _isJson = require('is-json');
const __get = Symbol('__get');
const __config = Symbol('__config');
const __driver = Symbol('__driver');
const __sanitize = Symbol('__sanitize');

class Redis {
    
    constructor( driver, config ){
        this[__driver] = driver;
        this[__config] = config;
    }

    createClient( config ){
        let client = this[__driver].createClient(this[__config] || config);
        return this.client
            ? _.assign( _.cloneDeep( this ), { client } )
            : _.assign( this, { client } );
    }

    [__get]( value ){
        return _isJson( value ) ? JSON.parse( value ) : value;
    }

    [__sanitize]( value ){
        return _.isObject( value )
            ? JSON.stringify(value)
            : _.isNull( value ) || _.isUndefined( value )
                ? "" 
                : value;
    }

    stream( key ){
        return streamify( this.client, key );
    }

    *get( key ){
        return this[__get]( yield this.client.getAsync( key ));
    }

    *set( key, value ){
        return yield this.client.setAsync( key, this[__sanitize]( value ));
    }

    *lpush( key, value ){
        return yield this.client.lpushAsync( key, this[__sanitize]( value ));
    }

    *rpush( key, value ){
        return yield this.client.rpushAsync( key, this[__sanitize]( value ));
    }

    *lpop( key ){
        return this[__get]( yield this.client.lpopAsync( key ));
    }

    *rpop( key ){
        return this[__get]( yield this.client.rpopAsync( key ));
    }

    *exists( key ){
        return this[__get]( yield this.client.existsAsync( key ));
    }

    *execBatch( ...batch ){
        let multi = this.client.multi();
        for( let {fn, key, value} of batch ){
            if(_.isArray( value )){
                for( let _val of value ){
                    multi[ fn ]( key, this[__sanitize]( _val ));
                }
                continue;
            }

            multi[ fn ]( key, this[__sanitize]( value ));
        }
        return multi.execAsync();
    }

    end( callback ){
        return this.client.quit( callback );
    }

}

module.exports = Redis;