const redis = require('redis')

const client = redis.createClient()

client.hset('metaparser_analytics', 'metaparser_aviaparser', JSON.stringify([
'PARSE_DATE','PARSE_TIME','CLASS','DIRECTION','DEPARTURE','RETURN','CARRIER_FW','CARRIER_BW','FLIGHTS','DIRECT','CHANNEL','AGENT','FICS','FARE','TAXES','COM %','COM ABS','T%','DIS/MAR','NF%','NC%','NT%','SALE','LDIFF','MAX DIFF','NEED DIFF%','NEED DIFF','NNF%','NNC%','NNT%','FAKE/NO FARE','HIDDEN','OTA1','OTA2','OTA3','OTA1N','OTA2N','OTA3N','COUNT', 'MDM_MARKUP', 'PMODE', 'POS_OFFER', 'CARRIER_FW_VALID', 'CARRIER_BW_VALID', 'FLIGHTNUMBERS', 'OTT_PLACE', 'OTT_PRICE'
    ]), function(err){
	console.log(err || 'ok')
})