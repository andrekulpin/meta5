const mm = require('micromatch');

module.exports = function( path, collection ){
	const strategy = getStrategy( path );
	return mm.match( collection, strategy(), { nocase: true });
}

function getStrategy( path ){
	let key = (
		path.indexOf('./') > -1
			? 'bylocalName'
			: path.indexOf('.') > -1
				? 'byExtname'
				: 'byBasename'
	)
	return strategies[ key ]( path );
}

const strategies = {
	byExtname: function( path ){
		return function(){
			return '**/' + path;	
		}
	},
	byBasename: function( path ){
		return function(){
			return '**/' + path + '(*.js|/index.js)';	
		}
	},
	bylocalName: function( path ){
		return function(){
			return '**/' + path.slice(2) + '(|.js)'
		}
	}
}