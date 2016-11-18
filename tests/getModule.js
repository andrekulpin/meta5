module.exports = function( obj ){

	if( Array.isArray( obj ) && 'function' === typeof obj[ obj.length - 1 ]){

		return obj[ obj.length - 1 ];

	}

	return obj;	
}