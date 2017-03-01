const _ = require('lodash');
const moment = require('moment');

const specialHeaders = [	
	'AGENT','FICS','FARE','TAXES','COM %','COM ABS','T%',
	'DIS/MAR','NF%','NC%','NT%','SALE','LDIFF','MAX DIFF',
	'NEED DIFF%','NEED DIFF','NNF%','NNC%','NNT%',
	'FAKE/NO FARE','HIDDEN','MDM_MARKUP'
];

function getOttFareFigures( priceInfo, $fare ){
	var fare = priceInfo.getProperty('fare');
	var agent = priceInfo.getProperty('agent');
	var taxes = priceInfo.getProperty('taxes');
	var comAbs = priceInfo.getProperty('commission');
	var comPer = priceInfo.getProperty('commission%');
	var fics = priceInfo.fics;
	var tPer = comAbs / ( fare + taxes );
	var sale = priceInfo.getProperty('amount');
	var disMar = sale - fare - taxes;
	var nfPer = ( comAbs + disMar ) * 100 / fare;
	var ncPer = add( nfPer * 100 / comPer, 2);
	var ntPer = (comAbs + disMar) * 100 / ( fare + taxes + disMar );
	var lDiff = _.get($fare, 'list.[0].price', 0 ) - sale;
	var maxDiff = 100;
	var needDiffPer = 10;
	var needDiff = lDiff > maxDiff 
		? ( lDiff > 0 ? lDiff - lDiff : lDiff + lDiff ) / 100 * needDiffPer
		: lDiff < 0 ? lDiff + lDiff / 100 * needDiffPer : 0;
	var nnfPer = needDiff !== 0 
		? ( comAbs + disMar + needDiff ) * 100 / fare
		: '';
	var nncPer = needDiff !== 0 
		? nnfPer * 100 / comPer
		: '';
	var nntPer = needDiff !== 0
		? (( comAbs + needDiff ) * 100 / ( fare + taxes + needDiff ))
		: '';
	var mdm_markup = priceInfo.getProperty('mdm_markup');	

	var fake = _.get($fare, 'list.[0].name', '').match( /onetwotrip/i ) 
		? 'OK' 
		: needDiff * -1 > comPer 
			? 'ALARM' 
			: 'OK'
	var isHidden = priceInfo.isHidden ? '1' : '0';

	function add(n, f){
		f = Math.pow(10, f || 0);
		return ( isFinite( n ) ? Math.round( f * n ) / f : '' );
	}

	return { 
		'AGENT': agent,
		'FICS': fics,
		'FARE': fare,
		'TAXES': taxes,
		'COM %': comPer,
		'COM ABS': add( comAbs ),
		'T%': add( tPer, 2 ),
		'DIS/MAR': add( disMar ),
		'NF%':  add( nfPer, 2 ),
		'NT%':  add( ntPer, 2 ),
		'NC%': add( ncPer, 2 ),
		'SALE': add( sale ),
		'LDIFF': add( lDiff ),
		'MAX DIFF': maxDiff,
		'NEED DIFF%': add( needDiffPer, 2 ),
		'NEED DIFF': add( needDiff ),
		'NNF%': add( nnfPer, 2) || fake === 'OK' ? '' : 0,
		'NNC%': add( nncPer, 2) || fake === 'OK' ? '' : 0,
		'NNT%': add( nntPer, 2) || fake === 'OK' ? '' : 0,
		'FAKE/NO FARE': fake,
		'HIDDEN': isHidden,
		'MDM_MARKUP': mdm_markup || ''
	}

}

module.exports = ['BaseService', BaseService => {

	class Formatter extends BaseService {
		constructor( task ){
			super();
			this.task = task;
		}

		merge( fares, ottFares ){

			const result = [];

			const { source, from, to, dateFrom, dateTo, mode } = this.task;

			ottFares = _.reduce( ottFares, function( o, datum, key ){
				o[ key ] = _.extend({}, datum, new OTTSEARCH_FUNCS() );
				return o;
			}, {});

			const date = moment();
			const today = date.format('YYYY/MM/DD');
			const time = date.format('hh:mm:ss');

			_.each( fares, ( fare, key ) => {
				let list = fare.list;
				if(list.length <= 1){
					return;
				}

				let position = fare.position;
				let keyParts = key.split('-');
				let airlines = _.map( keyParts, key => key.slice( 0, 2 ) )
				let flightNumbers = _.map( keyParts, key => key.slice( 2 ) )
				let ott_place = _.findIndex( list, ({ name, price }) => name.match( /onetwotrip/i ));
				let ott_price = _.get( list, '['+ ott_place++ +'].price', '' );
				let offer = {
					'PARSE_DATE': today,
					'PARSE_TIME': time,
					'CLASS': 'E',
					'DIRECTION': from + '-' + to,
					'DEPARTURE': dateFrom,
					'RETURN': dateTo ? dateTo : '',
					'CARRIER_FW': airlines[ 0 ],
					'CARRIER_BW': dateTo ? airlines[ 1 ] : '',
					'FLIGHTS': key,
					'DIRECT': fare.isDirect ? '' : 1,
					'CHANNEL': source,
					'OTA1': _.get(list, '[0].name', ''),
					'OTA2': _.get(list, '[1].name', ''),
					'OTA3': _.get(list, '[2].name', ''),
					'OTA1N': _.get(list, '[0].price', ''),
					'OTA2N': _.get(list, '[1].price', ''),
					'OTA3N': _.get(list, '[2].price', ''),
					'COUNT': 1,
					'PMODE': mode || 'auto',
					'POS_OFFER': position,
					'CARRIER_FW_VALID': '',
					'CARRIER_BW_VALID': '',
					'FLIGHTNUMBERS': flightNumbers.join('-'),
					'OTT_PLACE': ott_place || '',
					'OTT_PRICE': ott_price
				}
				let ottFare = ottFares[ key ];
				if( ottFare ){
					offer = _.extend({}, offer, getOttFareFigures( ottFare, fare ));
				}
				result.push( offer );
			});
			return result;
		}

	}

	return Formatter;

}];


function OTTSEARCH_FUNCS( data ){
	this.getProperty = function(key, name){
		var value;
		switch(key){
			case 'platingcarrier':    value = this.perDirInfo ? this.perDirInfo[0].platingCarrier : this.platingCarrier; break;
			case 'platingcarrier_bw': value = this.perDirInfo ? this.perDirInfo[1].platingCarrier : (this.dirsCount > 1 ? this.platingCarrier : ''); break;
			case 'agent': 		value = this.agentLogin; break;
			case 'fare': 		value = this.priceInfo.adtBase*this.priceInfo.currencyRUBRate; break;
			case 'amount': 		value = this.priceInfo.amount*this.priceInfo.currencyRUBRate; break;
			case 'taxes': 		value = this.priceInfo.adtTaxes*this.priceInfo.currencyRUBRate; break;
			case 'markup': 		value = this.priceInfo.markup*this.priceInfo.currencyRUBRate; break;
			case 'mdm_markup':
				if(this.mdmMarkupAmount === undefined){
					this.mdmMarkupAmount = getAmountValue(this.priceInfo, 'markup', 'mdm_action')*this.priceInfo.currencyRUBRate;
				}
				value = this.mdmMarkupAmount; break;
			case 'commission':
				if(this.commissionAmount === undefined){
					this.commissionAmount = getAmountValue(this.priceInfo, 'commission')*this.priceInfo.currencyRUBRate;
				}
				value = this.commissionAmount; break;
			case 'commission%':
				if(this.commissionPercent === undefined){
					this.commissionPercent = 100*getAmountValue(this.priceInfo, 'commission')/this.priceInfo.adtBase;
				}
				value = this.commissionPercent; break;
			default : value = 'err';
		}

		if(isFinite(value)){
			return Math.round(100*value)/100;
		}

		return value;

		function getAmountValue(priceInfo, tag, source){
			var commissionAmount = 0;
			for(var i = 0; i < priceInfo.profitParts.length; i++){
				var pp = priceInfo.profitParts[i];
				if(pp.clientId == '12trip' && pp.tag == tag && (!source || pp.source == source)){
					commissionAmount += pp.absAmt;//todo ProfitParty math
				}
			}
			return commissionAmount;
		}
	};
}