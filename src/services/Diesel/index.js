var spawn = require('child_process').spawn;

module.exports = ['BaseService', 'IPC', function( BaseService, IPC ){
	class Diesel extends BaseService {
		constructor( options ){
			super();
			this._options = options;
			this._steps = [];
			this._steps.push(() => {
				return new P(( resolve, reject ) => {
					this._awaitType = 'ready';
					this._resolve = resolve;
					this._child = spawn( __electron, [ __path ] );
					this._child.stdout.on( 'data', eventHandler.bind( this ) );
					this._child.stdin.write( __sendMessage( 'ready', this._options ));
				});
			});
		}

		end(){

		}

		goto(){

		}

		wait(){

		}

		waitFor(){

		}

		waitUntil(){

		}

		click(){

		}

		evaluate(){

		}

	}
	return Diesel;
}];