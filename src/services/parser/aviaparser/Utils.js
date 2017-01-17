const { find } = require('lodash');
const moment = require('moment');

module.exports = ['CronUtils', function( CronUtils ){

	class Utils extends CronUtils {

		static getParser( name ){
			let [ dash, dot ] = [ !!~name.indexOf('_'), !!~name.indexOf('.') ];
			return dash || dot 
				? dash 
					? name.indexOf('_')[1]
					: name.indexOf('.')[1]
				: name;
		}

		static getOTTParams( { source, from, to, dateFrom, dateTo  } ){
			let clientId = this.getParser( source )
			let dateOne = moment( dateFrom, 'YYYY-MM-DD' ).format('DDMM');
			let dateTwo = dateTo ? moment( dateTo, 'YYYY-MM-DD' ).format('DDMM') : '';
			let route = dateOne + from + to + dateTwo;
			return {
				clientId,
				route,
				cs: 'E'
			}
		}

		static generateKey({ source, from, to, dateFrom, dateTo }){
			return [ source, from, to, dateFrom, dateTo ].join('_');
		}

		static getOTTDataObj( data ){
			return OTTSEARCH_FUNCS( data );
		}

	}

	return Utils;

}]

function OTTSEARCH_FUNCS( data ){
	if(!(this instanceof OTTSEARCH_FUNCS)){
		// init
		if(data && data.ottData){
			var newOttData = {};

			for(var key in data.ottData){
				var elm = data.ottData[key];
				newOttData[key] = new OTTSEARCH_FUNCS();
				//copy object properties
				for(var prop in elm){
					newOttData[key][prop] = elm[prop];
				}
			}
			// replace original data with prototyped
			data.ottData = newOttData;
		}
		return data;
	}
	// prototype functions
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
					commissionAmount += pp.absAmt;
				}
			}
			return commissionAmount;
		}
	};
}