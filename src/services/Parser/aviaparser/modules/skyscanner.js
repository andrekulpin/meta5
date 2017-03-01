const retry = require('co-retry');
const moment = require('moment');
const _ = require('lodash');


module.exports = ['models/aviaparser', 'NetUtils', 'references', 'BaseService', function( model, utils, getReference, BaseService ){

    const __getGeoName = Symbol('__getGeoName');
    const __getFares = Symbol('__getFares');
    
    class SkyscannerParser extends BaseService {

        constructor( task, config ){
            super();
            this.task = task;
            this.config = config;
        }

        *getFares(){
            this.log.info('getFares_0');
            const { from, to, dateFrom, dateTo } = this.task;
            const codes = yield model.getCodes();
            const [ codeFrom, codeTo ] = yield [
                codes[ from ] || this[__getGeoName]( from ),
                codes[ to ] || this[__getGeoName]( to )
            ];
            let body = getBody( codeFrom, codeTo, dateFrom, dateTo );
            const { body: data } = yield this[ __getFares ]( body );
            var parsedFares = parseResponse( data );
            this.log.info('getFares_success');
            return parsedFares;
        }

        *[__getGeoName]( city ){
            this.log.info('getGeoName_0', city);
            const { headers } = this.config;
            headers['user-agent'] = utils.getUserAgent();
            const proxy = utils.getProxy( this.config.proxy );
            const url = this.config.url['geo'];
            let request = utils.customRequest({
                url,
                method: 'GET',
                headers,
                proxy,
                timeout: 15000
            });
            return yield request.exec();
        }

        *[__getFares]( body ){
            //headers['X-Skyscanner-ViewId'] = __getHackedRequestId__();
            const { headers } = this.config;
            headers['user-agent'] = utils.getUserAgent();
            const proxy = utils.getProxy( this.config.proxy );
            let url = this.config.url[ 'fares' ];
            url = utils.renderString( url, { domain: 'ru', id: '' } );
            let request = utils.customRequest({
                url,
                method: 'POST',
                headers,
                proxy,
                body,
                timeout: 15000
            });
            var response = yield request.exec();
            return response;
        }



    }

    return SkyscannerParser;

}]


function getBody( from, to, start, end ){
    return {
        market: 'RU',
        currency: 'RUB',
        locale: 'ru-RU',
        adults: 1,
        children: 0,
        infants: 0,
        cabin_class: 'economy',
        prefer_directs: false,
        trip_type: end ? 'return' : 'one-way',
        options: {
            include_unpriced_itineraries: false
        },
        legs: [
            {
                origin: from,
                destination: to,
                date: start,
                return_date: end || ''
            }
        ]
    }   
}

function parseResponse( data ){
    var itineraries = data.itineraries;
    var _prices = [];
    var _tmp = {};

    var $$ = refactorize({
        agents: data.agents,
        places: data.places,
        segments: data.segments,
        carriers: data.carriers,
        legs: data.legs
    });

    for(var i in itineraries){
        var it = itineraries[ i ];
        var key = [];
        var _key = [];
        for(var k in it.leg_ids){
            var leg = $$.legs[ it.leg_ids[ k ] ];
            for(var l in leg.segment_ids ){
                var s_id = leg.segment_ids[ l ];
                _key.push( $$.carriers[ leg.marketing_carrier_ids[ 0 ] ].display_code);
                _key.push(_.padStart($$.segments[ s_id ].marketing_flight_number, 4, '0' ));
                key.push( _key.join('') );
                _key.length = 0;
            }
        }
        for(var q in it.pricing_options){
            var option = it.pricing_options[ q ];
            _prices.push({
                name: $$.agents[ option.agent_ids[ 0 ] ].name,
                price: option.items[ 0 ].price.amount || option.price.amount || 0
            })
        }
        _tmp[ key.join( '-' ) ] = {
            list: _prices.slice( 0 ),
            position: ++i,
            isDirect: leg.stop_count
        }

        _prices.length = 0;
    }

    return _tmp;
}

function refactorDict(  dict, id ){
    var tmp = {}
    for(var i in dict){
        tmp[ dict[ i ][ id ] ] = dict[ i ]
    }
    return tmp;
}

function refactorize( arr ){
    var obj = {}
    for(var i in arr){
        obj[ i ] = refactorDict( arr[ i ], 'id' );
    }
    return obj;
}