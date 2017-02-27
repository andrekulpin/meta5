const _ = require('lodash')


let value = _.attempt(n => JSON.parse(n), '10')

//console.log(value)

/*var pipe = _.flow([ 

	n => n * n, 
	n => n * 1000 ]

);*/

const MAP = {
	source: 'source',
	destination: 'to',
	depart_date: 'dateFrom',
	return_date: 'dateTo',
	origin: 'from'
}

var task = {
	source: 'sky', depart_date: '20170316', origin: 'MOW', destination: 'LED'
}

var headers = [[task,task,task], [task,false,false]];

var gg = _.flow([
	_.flatten,
	_.compact,
	_.partial( _.map, _, n => _.pick(n, _.keys( MAP )) ),
	_.partial( _.map, _, n => _.mapKeys( n, ( v, k ) => MAP[ k ] ) ),
	_.shuffle
]);


var go = _.cond([
	[ _.isError,  _.identity ],
	[ _.stubTrue, _.identity ]
]);


var b = _.flow([ 
	_.partial( _.attempt, gg, _ ), 
	go
])


var sss = _.cond([
	[ _.matches('a'), _.constant(555) ],
	[ _.stubFalse, _.constant(404) ]
])

console.log(sss('a'))


