const retry = require('co-retry');
const moment = require('moment');

module.exports = ['models/metaparser', 'NetUtils', function( model, utils ){

    const __getGeoName = Symbol('__getGeoName');
    const __getFares = Symbol('__getFares');
    
    class SkyscannerParser {

        constructor( task, config ){
            this.task = task;
            this.config = config;
        }

        *getFares(){
            const { from, to, dateFrom, dateTo } = this.task;
            const codes = yield model.getCodes();

            const [ codeFrom, codeTo ] = yield [
                codes[ from ] || this[__getGeoName]( from ),
                codes[ to ] || this[__getGeoName]( to )
            ];

            const body = getBody( codeFrom, codeTo, dateFrom, dateTo );
            console.log(body)
            const { body: data } = yield this[ __getFares ]( body );

            return parseResponse( data );

        }

        *format(){

        }

        *[__getGeoName]( city ){
            const { headers } = this.config;
            headers['user-agent'] = utils.getUserAgent();
            const proxy = utils.getProxy( this.config.proxy );
            const url = this.config.url['geo'];
            let sendRequest = utils.customRequest({
                method: 'GET',
                headers,
                proxy,
                timeout: 15000
            });
            return yield sendRequest( url );
        }

        *[__getFares]( body ){
            //headers['X-Skyscanner-ViewId'] = __getHackedRequestId__();
            const { headers } = this.config;
            headers['user-agent'] = utils.getUserAgent();
            const proxy = utils.getProxy( this.config.proxy );
            let url = this.config.url[ 'fares' ];
            url = utils.renderString( url, { domain: 'ru', id: '' } );
            let sendRequest = utils.customRequest({
                method: 'POST',
                headers,
                proxy,
                body,
                timeout: 15000
            });
            const response = yield sendRequest( url );
            return response;
        }



    }

    return SkyscannerParser;

}]


function getBody( from, to, start, end ){
    return JSON.stringify(
        {
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
    );
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
        //get the key
        var key = [];
        var _key = [];
        for(var k in it.leg_ids){
            var leg = $$.legs[ it.leg_ids[ k ] ];
            _key.push( $$.places[ leg.origin_place_id ].display_code );
            _key.push( $$.places[ leg.destination_place_id ].display_code );
            _key.push( $$.carriers[ leg.marketing_carrier_ids[ 0 ] ].display_code );
            _key.push( leg.stop_count );
            _key.push( moment( leg.departure, moment.ISO_8601 ).format('HHmm') );
            _key.push( moment( leg.arrival, moment.ISO_8601 ).format('HHmm') );
            key.push( _key.join( '-' ) );
            _key.length = 0;
        }

        for(var q in it.pricing_options){
            var option = it.pricing_options[ q ];
            _prices.push({
                n: $$.agents[ option.agent_ids[ 0 ] ].name,
                p: option.items[ 0 ].price.amount || option.price.amount || 0,
                l: option.items[ 0 ].url
            })
        }

        _tmp[ key.join( ':' ) ] = {
            list: _prices.slice( 0 ),
            position: ++i
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

