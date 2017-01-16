module.exports = ['api/avia', function( aviaApi ){
	return function(){
		return function*( next ){

			if(this.cookies.get('goodboy')){
				return yield next;
			}

			const auth = this.request.headers['authorization'];

			if(!auth){
				return this.throw( 401 );
			}

			const str = Buffer.from(auth.slice(6), 'base64').toString('utf8');
			const [ login, pass ] = str.split(':');

			console.log(login, pass)

			let res = yield aviaApi.auth({
				login,
				pass
			});

			let { success, clientInfo } = res;

			if(!success){
				return this.throw( 401 );
			}

			this.cookies.set('goodboy', 1);

			yield next;
		}
	}
}]