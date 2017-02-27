const co = require('co');
const _ = require('lodash');
const fs = require('fs');
const P = require('bluebird');
const path = require('path');
const moment = require('moment');
const CSV = require('./src/services/CSV')[1]( function Foo(){} )
const headers = [
	'parse_date', 'parse_time', 'class', 'direction', 
	'departure', 'return', 'carrier_fw','carrier_bw',
	'flights', 'direct', 'channel', 
	'agent', 'fics',
	'fare', 'taxes', 'com%', 'com_abs', 't%', 'dis/mar',
	'nf%','nc%','nt%','sale','ldiff','max diff', 'need diff%',
	'need diff', 'nnf%', 'nnc%', 'nnt%', 'fake/no fare',
	'hidden', 'ota1', 'ota2', 'ota3','ota1n', 'ota2n', 'ota3n',
	'1posurl', '2posurl', '3posurl', 'count', 'mdm_markup',
	'pmode','pos_offer','carrier_fd_valid', 
	'carrier_bw_valid', 'flightnumbers','ott_place','ott_price'
]

const specialHeaders = [	
	'agent', 'fics',
	'fare', 'taxes', 'com%', 'com_abs', 't%', 'dis/mar',
	'nf%','nc%','nt%','sale','ldiff','max diff', 'need diff%',
	'need diff', 'nnf%', 'nnc%', 'nnt%', 'fake/no fare',
	'hidden'
];

co(function*(){

	const direction = 'MOW-LED';
	const back = '';
	const departure = '2017-03-10'
	const channel = 'skyscanner';

	const json = yield readFile('./boy.csv')
	const data = JSON.parse( json );
	const csv = new CSV(headers)

	var fuckDate = moment();
	var today = fuckDate.format('YYYY/MM/DD');
	var time = fuckDate.format('hh:mm:ss');

	var foundd = 0;
	var not = 0

	let { fares, ottFares: ottData } = data;


	return console.log( ottData )

	ottData = _.mapKeys( ottData, ({ keyByTime }) => keyByTime)


	for(key in fares){


		var fare = _.map( fares[key].list, ({ n, p }) => { return { n, p }} );

		//DME-TRN-S7-1-1140-1635:TRN-DME-LH-1-1035-1750

		//S74437-S74502

		var segments = key.split(':');
		var keyParts = _.map( segments, segment => segment.split('-') );
		var ott_place = _.findIndex( fare, ({ n, p }) => n.match( /onetwotrip/i ));
		var ott_price = _.get( fare, '['+ ott_place++ +'].p', '' );

		var line = {
			'parse_date': today,
			'parse_time': time,
			'class': '',
			'direction': direction,
			'departure': departure,
			'return': back ? back : '',
			'carrier_fw': keyParts[0][2],
			'carrier_bw': back ? keyParts[1][2] : '',
			'flights': key,
			'direct': keyParts[0][3] == '0',
			'channel': channel,
			'ota1': _.get(fare, '[0].n', ''),
			'ota2': _.get(fare, '[1].n', ''),
			'ota3': _.get(fare, '[2].n', ''),
			'ota1n': _.get(fare, '[0].p', ''),
			'ota2n': _.get(fare, '[1].p', ''),
			'ota3n': _.get(fare, '[2].p', ''),
			'count': 1,
			'mdm_markup': '',
			'pmode': 'manual',
			'pos_offer': fares[key].position,
			'carrier_fw_valid': '',
			'carrier_bw_valid': '',
			'flightnumbers': '',//flightNumber && flightNumber.replace(/..([0-9]{4}-?)/g, '$1') || "";
			'ott_place': ott_place,
			'ott_price': ott_price
		}


		var priceObj = ottData[key];
		if(priceObj){

			console.log(priceObj.priceInfo.currencyRUBRate)
			return
			var _fare = priceObj.priceInfo.adtBase;
			var agent = priceObj.priceInfo.agentLogin;
			var taxes = priceObj.priceInfo.adtTaxes;
			var comAbs = getAmountValue(priceObj.priceInfo, 'commission');
			//console.log(comAbs)
			//return

			var fnMap = {
				'comPer': n => n.adtBase,
				'agent': n => n.agentLogin,


			}


			var comPer = 100 * getAmountValue(priceObj.priceInfo, 'commission');





			var tPer = comAbs / ( _fare + taxes );
			var sale = priceObj.priceInfo.amount;
			var disMar = sale - _fare - taxes;
			var nfPer = ( comAbs + disMar ) * 100 / _fare;
			var ncPer = nfPer * 100 / comPer || '';
			var ntPer = (comAbs + disMar) * 100 / ( _fare + taxes + disMar );
			var lDiff = _.get(fare, '[0].p', 0 ) - sale;
			var maxDiff = 100;
			var needDiffPer = 10;
			//var needDiff = lDiff > maxDiff ? 

/*			_.reduce( specialHeaders, ( o, v, k ) => {

				o[ k ] = 

			}, {});*/

			var needDiff = (function(){
				if(lDiff > maxDiff){
					if(lDiff > 0){
						return lDiff - lDiff / 100 * needDiffPer;	
					} else {
						return lDiff + lDiff / 100 * needDiffPer;
					}
				} else if (lDiff < 0){
					return lDiff + lDiff / 100 * needDiffPer;
				}
				return 0;
			})();
			var nnfPer = (function(){
				if(needDiff !== 0){
					return ( comAbs + disMar + needDiff ) * 100 / _fare
				}
				return 'OK';
			})();
			var nncPer = (function(){
				if(needDiff !== 0){
					return nnfPer * 100 / comPer;
				}
				return 'OK'
			})();
			var nntPer = (function(){
				if(needDiff !== 0){
					return (( comAbs + needDiff ) * 100 / ( _fare + taxes + needDiff ) )
				}
				return 'OK';
			})();


			//ottdata headers

			line = _.extend({}, line, {
				'fare': _fare,
				'agent': agent,
				'taxes': taxes,
				'com_abs': comAbs,
				'com%': comPer,
				't%': tPer,
				'sale': sale,
				'dis/mar': disMar,
				'nf%': nfPer,
				'nc%': ncPer,
				'nt%': ntPer,
				'ldiff': lDiff,
				'max diff': maxDiff,
				'need diff%': needDiffPer,
				'need diff': needDiff,
				'nnf%': nnfPer,
				'nnc%': nncPer,
				'nnt%': nntPer,
				'fake/no fare': '',
				'hidden': 0
			});


		}


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



		csv.addLine(line);
		
		//return
    }

   	
/*
    console.log(_.keys(ottData).length)

    */
    console.log(foundd)
    console.log(123)
    var res = csv.end();
    //console.log(res)
    //console.log(res)
    fs.writeFileSync(path.join(__dirname, 'testo.csv'), res)
    console.log('done')
    //console.log(res)



})
.catch(function(err){
	console.log(err)
})



function BestPricesCutter(){
	if(!(this instanceof BestPricesCutter)){
		return new BestPricesCutter();
	}
	var acIndex = {};
	var self = this;

	this.add = function(index, lv){
		var acKey = lv.acFw + lv.acBw;
		// if(lv.ottData instanceof Object){
		// 	acKey = lv.ottData.getProperty('platingcarrier') +
		// 			lv.ottData.getProperty('platingcarrier_bw');
		// }

		if(!acIndex[acKey]){
			acIndex[acKey] = {
				d : [], // direct
				s : []  // with stops
			};
		}

		var key  = lv.direct ? 'd' : 's';
		var info = {
			i  : index, 						// index in array
			p  : (+lv.OTA1 || +Infinity),	// best price
			dt : (lv.ottData ? 1 : 0) 		// Has ottData
		};

		acIndex[acKey][key].push(info);
	};

	this.cut = function(lines, hideHeaders, options){
		options = options || {};

		if(options.bestFareNum){
			return self.cutMode2(lines, hideHeaders, options);
		}
		// default mode
		return self.cutMode1(lines, hideHeaders, options);
	};

	this.cutMode1 = function(lines, hideHeaders, options){
		var newLines = [];

		if(!hideHeaders){
			newLines.push(lines[0]);
		}

		function priceRank(a, b){ return a.p - b.p; }

		// mode 1 > select best direct & w/stops flight 1 for each ACfw-ACbw key
		for(var acKey in acIndex){
			var acElm = acIndex[acKey];
			acElm.d.sort(priceRank); // sort direct flights
			acElm.s.sort(priceRank); // sort flights with stops

			// preffer bestPrice lines with ottData
			for(var k in acElm){
				for(var n in acElm[k]){
					var info = acElm[k][n];
					newLines.push(lines[info.i]);
				}
			}
		}

		return newLines;
	};

	this.cutMode2 = function(lines, hideHeaders, options){
		var newLines = [];
		var bestFareNum = options.bestFareNum || 1;

		if(!hideHeaders){
			newLines.push(lines[0]);
		}

		function priceRank(a, b){ return a.p - b.p; }
		var directs = [];
		var wstops  = [];

		// flattern object
		for(var acKey in acIndex){
			var acElm = acIndex[acKey];
			for(var k in acElm.d){ directs.push(acElm.d[k]); }
			for(var k in acElm.s){ wstops.push(acElm.s[k]); }
		}

		// sort by price
		directs.sort(priceRank);
		wstops.sort(priceRank);

		// choose best N prices
		for(var p = 0; p < bestFareNum; p++){
			if(directs[p]){
				newLines.push(lines[directs[p].i]);
			}
			if(wstops[p]){
				newLines.push(lines[wstops[p].i]);
			}
			if(!directs[p] && !wstops[p]){
				break;
			}
		}

		return newLines;
	};

	return this;
}




function readFile(name){
	return new P(function(resolve, reject){
		fs.readFile(name ,'utf8', function(err, data){
			if(err){
				return reject(err)
			}
			resolve(data)
		})
	})
}

function BestPriceCutter(){
	if(!(this instanceof BestPriceCutter)){
		return new BestPriceCutter();
	}
	var acIndex = {};
	var self = this;

	this.add = function(index, lv){
		var acKey = lv.acFw + lv.acBw;
		// if(lv.ottData instanceof Object){
		// 	acKey = lv.ottData.getProperty('platingcarrier') +
		// 			lv.ottData.getProperty('platingcarrier_bw');
		// }

		if(!acIndex[acKey]){
			acIndex[acKey] = {
				d : [], // direct
				s : []  // with stops
			};
		}

		var key  = lv.direct ? 'd' : 's';
		var info = {
			i  : index, 						// index in array
			p  : (+lv.OTA1 || +Infinity),	// best price
			dt : (lv.ottData ? 1 : 0) 		// Has ottData
		};

		acIndex[acKey][key].push(info);
	};

	this.cut = function(lines, hideHeaders, options){
		options = options || {};

		if(options.bestFareNum){
			return self.cutMode2(lines, hideHeaders, options);
		}
		// default mode
		return self.cutMode1(lines, hideHeaders, options);
	};

	this.cutMode1 = function(lines, hideHeaders, options){
		var newLines = [];

		if(!hideHeaders){
			newLines.push(lines[0]);
		}

		function priceRank(a, b){ return a.p - b.p; }

		// mode 1 > select best direct & w/stops flight 1 for each ACfw-ACbw key
		for(var acKey in acIndex){
			var acElm = acIndex[acKey];
			acElm.d.sort(priceRank); // sort direct flights
			acElm.s.sort(priceRank); // sort flights with stops

			// preffer bestPrice lines with ottData
			for(var k in acElm){
				for(var n in acElm[k]){
					var info = acElm[k][n];
					newLines.push(lines[info.i]);
				}
			}
		}

		return newLines;
	};

	this.cutMode2 = function(lines, hideHeaders, options){
		var newLines = [];
		var bestFareNum = options.bestFareNum || 1;

		if(!hideHeaders){
			newLines.push(lines[0]);
		}

		function priceRank(a, b){ return a.p - b.p; }
		var directs = [];
		var wstops  = [];

		// flattern object
		for(var acKey in acIndex){
			var acElm = acIndex[acKey];
			for(var k in acElm.d){ directs.push(acElm.d[k]); }
			for(var k in acElm.s){ wstops.push(acElm.s[k]); }
		}

		// sort by price
		directs.sort(priceRank);
		wstops.sort(priceRank);

		// choose best N prices
		for(var p = 0; p < bestFareNum; p++){
			if(directs[p]){
				newLines.push(lines[directs[p].i]);
			}
			if(wstops[p]){
				newLines.push(lines[wstops[p].i]);
			}
			if(!directs[p] && !wstops[p]){
				break;
			}
		}

		return newLines;
	};

	return this;
}
