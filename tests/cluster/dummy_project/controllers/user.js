module.exports = ['models/user', function( userModel ){

	return {
		name: 'userController',
		deps: [ userModel ]
	}

}]