module.exports = ['models/order', function( orderModel ){

	return {
		name: 'orderController',
		deps: [ orderModel ]
	}

}]