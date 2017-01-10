function universalFormater(lv, options){
	options = options || {};
	if(!lv){
		log.i('universalFormater_0', 'ERROR: line format error: lv undefined');
		return '';
	}

	if(lv.type == 'headers'){
		var headers = ['PARSE_DATE','PARSE_TIME','CLASS','DIRECTION','DEPARTURE','RETURN','CARRIER_FW','CARRIER_BW','FLIGHTS','DIRECT','CHANNEL','AGENT','FICS','FARE','TAXES','COM %','COM ABS','T%','DIS/MAR','NF%','NC%','NT%','SALE','LDIFF','MAX DIFF','NEED DIFF%','NEED DIFF','NNF%','NNC%','NNT%','FAKE/NO FARE','HIDDEN','OTA1','OTA2','OTA3','OTA1N','OTA2N','OTA3N','1POSURL','2POSURL ','3POSURL ','COUNT', 'MDM_MARKUP', 'PMODE', 'POS_OFFER', 'CARRIER_FW_VALID', 'CARRIER_BW_VALID', 'FLIGHTNUMBERS', 'OTT_PLACE', 'OTT_PRICE'];
		return headers.join(';');
	}

	if(lv.type != 'line'){
		log.i('universalFormater_1', 'ERROR line format?', lv.type);
		return '';
	}

	if(!lv.flightKey){
		log.i('universalFormater_2', 'ERROR line format: flightKey?', lv);
		return '';
	}

	// skip lines with specified ac
	if(options.excludeAC instanceof Array){
		for(var acIdx = 0; acIdx < options.excludeAC.length; acIdx++){
			var ac = options.excludeAC[acIdx];
			if(lv.acFw.indexOf(ac) > -1 || lv.acBw.indexOf(ac) > -1){
				return '';
			}
		}
	}

	// skip lines contained no selected ac
	if(options.selectAC instanceof Array){
		var acFound = false;
		for(var acIdx = 0; acIdx < options.selectAC.length; acIdx++){
			var ac = options.selectAC[acIdx];
			// search ac name in ac key (acFw may be equal [SU, SUIB])
			if(lv.acFw.indexOf(ac) > -1){ acFound = true; }
			if(lv.acBw.indexOf(ac) > -1){ acFound = true; }
		}

		if(!acFound){
			return '';
		}
	}

	var line = [];

	var date = new Date(lv.parsingDate);

	line.push(date.format('yyyy/mm/dd'));			// parsing date
	line.push(date.format('HH:MM:ss'));				// parsing time
	line.push(lv.serviceClass);						// class
	line.push(lv.from + '-' + lv.to);				// route
	line.push((lv.dateFw||'').replace(/\./g,'/')); 	// fwdDate
	line.push((lv.dateBw||'').replace(/\./g,'/')); 	// retDate
	line.push(lv.acFw);					// CARRIER FORWARD
	line.push(lv.acBw);					// CARRIER BACKWARD
	line.push(lv.flightKey);			// FLIGHTS
	line.push(lv.direct ? '1' : '');	// DIRECT / STOPS
	line.push(lv.channel);				// CHANNEL

	if(lv.ottData){
		function add(n, f){
			f = Math.pow(10, f||0);
			line.push(isFinite(n) ? Math.round(f*n)/f : '');
		}
		var f = lv.ottData;

		line.push(f.getProperty('agent'));					// AGENT
		line.push(f.fics); 									// fics
		add(calc.set('$G2', f.getProperty('fare')));		// FARE
		add(calc.set('$H2', f.getProperty('taxes')));		// TAXES
		add(calc.set('$I2', f.getProperty('commission%')), 2);	// COM %
		add(calc.set('$J2', f.getProperty('commission')));	// COM ABS
		add(calc.eval('$J2/($G2+$H2)'), 2);					// T%
		calc.set('$P2', f.getProperty('amount'));			// SALE
		add(calc.eval('$P2-$G2-$H2', '$L2'));				// DIS/MAR = SALE - FARE - TAXES
		add(calc.eval('($J2+$L2)*100/$G2','$M2'), 2);		// NF%
		add(calc.eval('$M2*100/$I2'), 2);					// NC%
		add(calc.eval('($J2+$L2)*100/($G2+$H2+$L2)', '$O2'), 2); // NT%
		add(calc.get('$P2'));								// SALE

		calc.set('$Y2', lv.OTA1); 						// * OTA1 price *
		add(calc.eval('$Y2-$P2', '$Q2')); 				// LDIFF
		add(calc.set('$R2', 100)); 						// MAX DIFF
		add(calc.set('$S2', 10), 2);					// NEED DIFF%
		add(calc.eval( 									// NEED DIFF
				'if($Q2 > $R2){ \
					if($Q2 > 0){ $Q2-$Q2/100*$S2; } else { $Q2+$Q2/100*$S2; } \
				}else{ \
					if($Q2 < 0){ $Q2+$Q2/100*$S2; } else { 0; } \
				}'
				, '$T2')
		);

		add(calc.eval(									// NNF%
				'if($T2!=0){ ($J2+$L2+$T2)*100/$G2 } else { "OK" }',
				'$U2', { allowStrings : true}), 2
		);

		add(calc.eval(									// NNC%
				'if($T2!=0){ $U2*100/$I2 } else { "OK" }',
				'$V2', { allowStrings : true}), 2
		);

		add(calc.eval(									// NNT%
				'if($T2!=0){ (($J2+$T2)*100/($G2+$H2+$T2)) } else { "OK" }',
				'$W2', { allowStrings : true}), 2
		);

		calc.set('$WEBEST', lv.OTA1N == "OneTwoTrip");  // if we first = OK (peter.kutis)
		line.push(calc.eval(							// FAKE/NO FARE
				'if($WEBEST){"OK"}else if(($T2*-1)>$I2){"ALARM"}else{"OK"}',
				undefined, { allowStrings : true})
		);
		line.push(lv.ottData.isHidden ? 1 : 0); //HIDDEN
	}
	else{
		// empty data
		for(var z = 0; z < 19; z++){ line.push('');	} 	// fill with empty values
		line.push((lv.ottDataSI || {}).disabledOnPresearch ? 'CLOSED' : 'ALARM');
		line.push('');
	}

	line.push(lv.OTA1);												// OTA1
	line.push(lv.OTA2);												// OTA2
	line.push(lv.OTA3);												// OTA3
	var digitsPart = line.join(';').replace(/\./g, ',');

	line = [];
	line.push(lv.OTA1N);
	line.push(lv.OTA2N);
	line.push(lv.OTA3N);
	line.push(quoteText(lv.OTA1L));
	line.push(quoteText(lv.OTA2L));
	line.push(quoteText(lv.OTA3L));
	line.push(1);													// COUNT

	var mdmMarkup = lv.ottData ? Math.round(f.getProperty('mdm_markup')) : 0;
	line.push(mdmMarkup || ''); // MassDirectionMarkups action MARKUP amount
	line.push(lv.parserMode || ''); // parser mode: manual | auto
	line.push(lv.position);	//POS_OFFER
	line.push(lv.acFwValid); //CARRIER FORWARD VALID
	line.push(lv.acBwValid); //CARRIER BACKWARD VALID
	line.push(lv.flightNumbers); //FLIGHTNUMBERS
	line.push(lv.ott_place); // OTT position from price list
	line.push(lv.ott_price); // OTT price
	var textPart = line.join(';');

	return [digitsPart, textPart].join(';');
}

module.exports = universalFormater;