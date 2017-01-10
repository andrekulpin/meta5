const H = require('highland');
const P = require('bluebird');
const _ = require('lodash');
const fs = require('co-fs');
const { join } = require('path');

module.exports = ['Utils', function*( utils ){

	let dict = yield fs.readdir( join( __dirname, 'dict' ) );

	return function*( references ){
		let files = isExist( dict, references );
		files = _.map( files, file => join( __dirname, 'dict', file ) );
		let jsons = yield utils.readJSONSafe( files );
		return _.reduce( jsons, ( o, value, key ) => {
			o[ key ] = value;
			return o;
		}, {} );

	}

}];

function isExist( dict, refs ){
	return _.filter( dict, file => {
		return _.find( refs, ref => file.indexOf( ref ) > -1 );
	});
}
