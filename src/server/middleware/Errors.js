module.exports = function(){
	return function*( next ){
		try {
			yield next;
		} catch( err ){
			if(err.status === 401){
				err.message = 'Authentication is needed';
				this.set('WWW-Authenticate', 'Basic');
			}
			this.status = err.status || 500;
			this.body = err.message || 'Internal server error';
			this.log.error( err.message );
		}
	}
}


