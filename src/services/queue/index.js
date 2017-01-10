const P = require('bluebird');
const co = require('co');
const { EventEmitter } = require('events');

module.exports = ['Utils', function( Utils ){
	
	class Queue extends EventEmitter {

		constructor(fn, concurrency){
			super();
			this.concurrency = concurrency;
			this.running = 0;
			this.fn = fn;
			this.drain = null;
			this.saturated = null;
			this.unsaturated = null;
			this.tasks = [];
		}

		push( task ){
			let self = this;
			self.tasks.push( task );
			if(self.running < self.concurrency){
				co(function*(){
					let task = self.tasks.shift();
					self.running++;
					yield self.fn(task);
					self.running--;
					self.emit('unsaturated');
				})
				.catch(function(err){
					console.log(err)
				})
				return callback => {
					callback();
				}
			}
			return self.repeat();
		}

		repeat(){
			let self = this;
			return new P(function(resolve){
				self.once('unsaturated', resolve);
			})
		}

	}
	return Queue
}]

