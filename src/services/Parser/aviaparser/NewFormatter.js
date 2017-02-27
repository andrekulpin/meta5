const _ = require('lodash');
const moment = require('moment');

const specialHeaders = [	
	'agent', 'fics','fare', 'taxes', 'com%', 'com_abs',
	't%','dis/mar','nf%','nc%','nt%','sale','ldiff',
	'max diff', 'need diff%','need diff', 'nnf%', 
	'nnc%', 'nnt%', 'fake/no fare','hidden'
];

function getOttFareFigures( priceInfo, $fare ){
	var fare = priceInfo.getProperty('fare');
	var agent = priceInfo.getProperty('agent');
	var taxes = priceInfo.getProperty('taxes');
	var comAbs = priceInfo.getProperty('commission');
	var comPer = priceInfo.getProperty('commission%');
	var tPer = comAbs / ( fare + taxes );
	var sale = priceInfo.amount;
	var disMar = sale - fare - taxes;
	var nfPer = ( comAbs + disMar ) * 100 / fare;
	var ncPer = nfPer * 100 / comPer || '';
	var ntPer = (comAbs + disMar) * 100 / ( fare + taxes + disMar );
	var lDiff = _.get($fare, '[0].p', 0 ) - sale;
	var maxDiff = 100;
	var needDiffPer = 10;
	var needDiff = lDiff > maxDiff 
		? ( lDiff > 0 ? lDiff - lDiff : lDiff + lDiff ) / 100 * needDiffPer
		: lDiff < 0 ? lDiff + lDiff / 100 * needDiffPer : 0;
	var nnfPer = needDiff !== 0 
		? ( comAbs + disMar + needDiff ) * 100 / fare
		: 'OK';
	var nncPer = needDiff !== 0 
		? nnfPer * 100 / comPer
		: 'OK';
	var nntPer = needDiff !== 0
		? (( comAbs + needDiff ) * 100 / ( fare + taxes + needDiff ) )
		: 'OK';
	return { 
		fare, agent, taxes, comAbs, comPer, 
		tPer, sale, disMar, nfPer, ncPer, 
		ntPer, lDiff, maxDiff, needDiffPer, 
		needDiff, nnfPer, nncPer, nntPer  
	}
}

module.exports = ['BaseService', 'CSV', ( BaseService, CSV ) => {

	class Formatter extends BaseService {
		constructor( task, headers ){
			super();
			this.task = task;
			this.headers = headers;
		}

		merge( fares, ottFares ){
			const csv = new CSV( this.headers );
			const { source, from, to, dateFrom, dateTo } = this.task;

			ottFares = _.reduce( ottFares, function( o, datum, key ){
				o[ key ] = _.extend({}, datum, new OTTSEARCH_FUNCS() );
				return o;
			}, {});

			const date = moment();
			const today = date.format('YYYY/MM/DD');
			const time = date.format('hh:mm:ss');
			_.each( fares, ( fare, key ) => {

				let keyParts = key.split('-');
				let ott_place = _.findIndex( fare, ({ n, p }) => n.match( /onetwotrip/i ));
				let ott_price = _.get( fare, '['+ ott_place++ +'].p', '' );

				let line = {
					'parse_date': today,
					'parse_time': time,
					'class': '',
					'direction': from,
					'departure': to,
					'return': dateTo ? dateTo : '',
					'carrier_fw': _.get( keyParts, '0', [] ).slice(0, 2),
					'carrier_bw': dateTo ? _.get( keyParts, '1', [] ).slice(0, 2) : '',
					'flights': key,
					'direct': '',//aiushdaoisuhdaosdhio
					'channel': source,
					'ota1': _.get(fare, '[0].name', ''),
					'ota2': _.get(fare, '[1].name', ''),
					'ota3': _.get(fare, '[2].name', ''),
					'ota1n': _.get(fare, '[0].price', ''),
					'ota2n': _.get(fare, '[1].price', ''),
					'ota3n': _.get(fare, '[2].price', ''),
					'count': 1,
					'mdm_markup': '',
					'pmode': 'manual',
					'pos_offer': fares[ key ].position,
					'carrier_fw_valid': '',
					'carrier_bw_valid': '',
					'flightnumbers': '',//flightNumber && flightNumber.replace(/..([0-9]{4}-?)/g, '$1') || "";
					'ott_place': ott_place,
					'ott_price': ott_price
				}

				let ottFare = ottFares[ key ];
				if( ottFare ){
					line = _.extend({}, line, getOttFareFigures( ottFare, fare ));
				}
				csv.addLine( line );
			});
				
			debugger;

			return csv.end();

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