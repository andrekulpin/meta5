module.exports = function(){
	return function*( next ){
		try {

			yield next;
			
		} catch( err ){

			this.status = err.status || 500;
			this.body = err.message;
			this.log.error( err.message );
			
		}
	}
}