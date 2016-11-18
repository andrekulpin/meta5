module.exports = ['models/city', function( cityModel ){

	return {
		name: 'cityController',
		deps: [ cityModel ]
	}

}]