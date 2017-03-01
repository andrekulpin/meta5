const cluster = require('cluster');
const epicLogo = require('./epic');
const { cpus } = require('os');

exports.init = function( config ){

	epicLogo();

	let workerCount = config.workerCount || cpus();

	while( workerCount-- ){
		cluster.fork(); 
	}

	cluster.on('exit', function(){
		this.fork();
	});

}