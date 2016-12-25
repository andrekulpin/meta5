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

module.exports = BestPriceCutter;