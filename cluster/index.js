const cluster = require('cluster');
const config = require('./config');
const master = require('./master');
const worker = require('./worker');

cluster.isMaster
	? master.init( config )
	: worker.init( config )