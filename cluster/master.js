const cluster = require('cluster');
const epic = require('./epic');
const { cpus } = require('os');

exports.init = function( config ){

	epic();

	let workerCount = config.workerCount || cpus();

	while( workerCount-- ){
		cluster.fork(); 
	}

	cluster.on('exit', function(){
		this.fork();
	});

}