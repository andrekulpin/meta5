const _ = require('lodash');

/*
	const csv = new CSV(['id','name','age']);

	_.each([
		{ id: 1, name: 'mark', age: 23 },
		{ id: 2, name: 'john', age: 27 },
		{ id: 3, name: 'nick', age: 30 }
	], function(line){
		csv.addLine( line );
	})

	var result = csv.end()
*/

module.exports = ['BaseService', function( BaseService ){

	class CSV extends BaseService {
		constructor( headers, delimiter ){
			super();
			this.headers = headers;
			this.data = [];
			this.delimiter = delimiter || ';';
		}

		addLine( line ){
			if( _.isEmpty( this.data ) && this.headers ){
				this.data.push( this.headers );
			}
			this.data.push( line );	
			return this; 
		}

		toFile( path ){
			this.path = path;
			return this;
		}

		end( callback ){
			let csv = [];
			_.each( this.data, ( line ) => {
				if(_.isString( line )){
					return csv.push( line );
				}
				if(_.isArray( line )){
					return csv.push( line.join( this.delimiter ));
				}
				if(_.isObject( line )){
					return csv.push(_.map( this.headers, ( header ) => {
						if(header === 'max diff'){
							console.log(header, line[ 'maxDiff' ])
						}
						return header in line ? line[ header ] : '';
					}).join( this.delimiter ));
				}
			});

			let result = csv.join('\n');

			return this.path
				? fs.writeFile( this.path, result, callback )
				: callback 
					? callback( result )
					: result;
		}

	}

	return CSV;

}];

/*

	[]

*/