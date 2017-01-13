const H = require('highland');
const P = require('bluebird');
const _ = require('lodash');
const fs = require('co-fs');
const { join } = require('path');

module.exports = ['src/utils', function*( utils ){

	let dict = yield fs.readdir( join( __dirname, 'dict' ) );

	return function*( reference ){
		let file = _.find( dict, key => key.indexOf( reference ) > -1 );
		file = join( __dirname, 'dict', file );
		let json = yield utils.readFileSafe( file );
		return json;
	}

}];