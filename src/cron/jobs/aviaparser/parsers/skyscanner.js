const retry = require('co-retry');
const moment = require('moment');
const _ = require('lodash');


module.exports = ['models/aviaparser', 'NetUtils', 'references', function( model, utils, getReference ){

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
            let body = getBody( codeFrom, codeTo, dateFrom, dateTo );
            const { body: data } = yield this[ __getFares ]( body );
            return parseResponse( data );
        }

        *formatFares( obj ){
            let { data: airports } = yield getReference('airports');
            return yield format( obj, airports );
        }

        *[__getGeoName]( city ){
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
            const response = yield request.exec();
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

function *format( obj, airports ){
    var data = obj.data;
    var fares = data && data.fares;
    var ottData = data && data.ottData || {};
    var universalFormater = obj.universalFormater;
    var bpc = new obj.BestPricesCutter();
    var options = obj && obj.options;
    var dateFrom = obj.task.dateFrom;
    var dateTo = obj.task.dateTo;

    if(ottData){
        var newOttData = {};
        for(var key in ottData){
            var value = ottData[key];
            value.key = key;
            newOttData[value.keyByTime] = value;
        }
        ottData = newOttData;
    }

    var csv = [];
    if(!obj.hideHeaders){
        csv.push(universalFormater({type: 'headers'}));
    }

    for(key in fares){
        var fare = fares[key];
        if(fare.list.length <= 1){
            // skip proposals with only one participant
            continue;
        }
        for(var company in fare.list){
            if(fare.list[company].p === ''){
                delete fare.list[company];
            }
        }

        // why we need it? we've already checked it for <= 1 and called continue
        if(Object.keys(fare).length === 0){
            continue;
        }
        var ott_place = undefined;
        var ott_price = undefined;
        var competitorsInOrder = [];
        var number = 0;
        for(var k in fare.list){
            number++;
            if(!ott_place && fare.list[k].n.match(/onetwotrip/i)){
                ott_place = number;
                ott_price = fare.list[k].p;
            }
            competitorsInOrder.push([
                fare.list[k].n,
                fare.list[k].p,
                fare.list[k].l
            ]);
        }

        // key : "DME-MAD-LH-1-0550-1130:MAD-DME-LH-1-1840-0300"
        //SVO-LED-SU-0-0710-0830---LED-SVO-SU-0-1530-1650
        var keyParts = key.split('-');
        var cityFrom = keyParts[0];
        var cityTo = keyParts[1];

        if(airports[cityFrom]){
            cityFrom = airports[cityFrom].city;
        }
        if(airports[cityTo]){
            cityTo = airports[cityTo].city;
        }

        var lv = {type: 'line'}; // line vars

        var flightNumber = ottData[key] ? ottData[key].key : '';
        if(flightNumber.length){
            key = flightNumber;
        }
        lv.channel = 'skyscanner';
        lv.parsingDate = data.parsingDate;              // parsing time
        lv.parserMode = data.parserMode;                // parser mode: auto|manual
        lv.serviceClass = data.serviceClass;            // class
        lv.from = cityFrom;                             // route from
        lv.to = cityTo;                                 // route to
        lv.dateFw = dateFrom;                           // fwdDate
        lv.oneway = dateTo ? false : true;              // oneway
        lv.direct = keyParts[3] == '0' && (keyParts[8] == undefined || keyParts[8] == '0'); // direct or with stops?
        lv.dateBw = dateTo || '';               // retDate
        lv.acFw = keyParts[2];                          // aircompany forward
        lv.acBw = keyParts[7] || '';                    // aircompany return
        lv.flightKey = key;                             // OTT KEY
        lv.ottData = ottData[key];                      // OTT FARES DATA
        if(!lv.ottData){
            var foundKey = _.find(ottData, function(data){
                return data.key == key;
            });
            if(foundKey){
                lv.ottData = ottData[foundKey.keyByTime];
            }
        }
        lv.ottDataSI = ottData['SPECIAL_INFO'];         // OTT SPECIAL INFO
        lv.OTA1N = competitorsInOrder[0] && competitorsInOrder[0][0] || '';      // OTA1 NAME
        lv.OTA2N = competitorsInOrder[1] && competitorsInOrder[1][0] || '';      // OTA2 NAME
        lv.OTA3N = competitorsInOrder[2] && competitorsInOrder[2][0] || '';      // OTA3 NAME
        lv.OTA1 = competitorsInOrder[0] && competitorsInOrder[0][1] || '';       // OTA1 PRICE
        lv.OTA2 = competitorsInOrder[1] && competitorsInOrder[1][1] || '';       // OTA2 PRICE
        lv.OTA3 = competitorsInOrder[2] && competitorsInOrder[2][1] || '';       // OTA3 PRICE
        lv.OTA1L = competitorsInOrder[0] && competitorsInOrder[0][2] || '';      // OTA1L LINK
        lv.OTA2L = competitorsInOrder[1] && competitorsInOrder[1][2] || '';      // OTA2L LINK
        lv.OTA3L = competitorsInOrder[2] && competitorsInOrder[2][2] || '';      // OTA3L LINK
        lv.position = fare.position || '';          // potision offer from page
        lv.acFwValid = '';
        lv.acBwValid = '';
        lv.flightNumbers = flightNumber && flightNumber.replace(/..([0-9]{4}-?)/g, '$1') || "";
        lv.ott_place = ott_place;
        lv.ott_price = ott_price;
        var line = universalFormater(lv, options);
        if(line){
            var index = csv.push(line) - 1;
            bpc.add(index, lv);
        }
    }

    // get only cheapest flights per aircompany
    csv = bpc.cut(csv, obj.hideHeaders, options);
    csv.push(''); // add \n to last element
    csv.join('\n');
    return csv.join('\n');
}