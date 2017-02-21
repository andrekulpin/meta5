const _ = require('lodash');
const fs = require('fs');
const path = require('path')

class CSV {
	constructor( headers, delimiter ){
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


const csv = new CSV(['id', 'name', 'age', 'sex']);

var fileName = path.join(__dirname, 'data.csv');

var res = csv
.toFile( fileName )
.addLine(['12312', 'mark', 24, true])
.addLine({
	id: '1212',
	name: 'tom',
	age: 27,
	sex: 'false'
})
.end(function(data){
	console.log(data)
})