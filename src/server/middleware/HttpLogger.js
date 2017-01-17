const uuid = require('node-uuid').v4;

module.exports = ['src/logger', function( getLogger ){
	return function( config ){
		const log = getLogger( config );
		return function*( next ){
			const requestId = uuid();
			this.log = log.child({ requestId });
			yield next;
		}
	}
}]