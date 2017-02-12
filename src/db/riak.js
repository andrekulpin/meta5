const _ = require('lodash');
const __config__ = Symbol('__config__');
const __driver__ = Symbol('__driver__');
const assert = require('assert');
const P = require('bluebird');

class Riak {

    constructor( driver, config ){
        this[__driver__] = driver;
        this[__config__] = config;
    }

    createClient( config ){
        let client = new this[__driver__].Client(this[__config__].host || config);
        return this.client
            ? _.assign( _.cloneDeep( this ), client ) 
            : _.assign( this, { client });
    }

    *get( object ){
        let [ bucket, key ] = _.split( object, '/' );
        assert(bucket, 'A bucket is needed.');
        assert(key, 'A key is needed.');
        return new P( ( resolve, reject ) => {
            this.client.fetchValue({
             bucket,
             key,
             convertToJs: true
            }, ( err, data ) => {
                if( err ){
                    return reject( err );
                }
                let value = _.get( data, 'values[0].value' );
                if( !value ){
                    return reject('Riak key does not exist.');
                }
                resolve( value );
            });
        });
    }

    *set( object, value ){
        let [ bucket, key ] = _.split( object, '/' );
        assert(bucket, 'A bucket is needed.');
        assert(key, 'A key is needed.');
        return new P( ( resolve, reject ) => {
            this.client.storeValue({ 
                bucket,
                key, 
                value 
            }, ( err, result ) => {
                if(err){
                    return reject( err );
                }
                resolve( result );
            })
        })
    }

    end( callback ){
        return this.client.stop( callback );
    }

}

module.exports = Riak;