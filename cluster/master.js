const cluster = require('cluster');
const { cpus } = require('os');

exports.init = function( config ){

	let workerCount = config.workerCount || cpus();

	while( workerCount-- ){
		cluster.fork(); 
	}

	cluster.on('exit', function(){
		this.fork();
	});

}