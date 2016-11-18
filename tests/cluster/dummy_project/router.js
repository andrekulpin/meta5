module.exports = ['controllers/*', function( controllers ){

	return {
		name: 'router',
		deps: [ controllers ]
	}

}]