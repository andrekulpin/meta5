exports.create = Calculator;

function Calculator(){
	if(!(this instanceof Calculator)){
		return new Calculator();
	}

	this.calcScope = new scope();
	
	this.eval = function (str, resultKey, opts) {
		return pn(this.calcScope.__calc__(str, resultKey, opts));
	}
	this.set = function(k, v){
		return this.calcScope.__add__(k, v);
	}
	this.get = function(k){
		return this.calcScope.__get__(k);
	}
	return this;
	
	function scope(){
		this.__calc__ = function(str, r, opts){
			if(opts && opts.noerrors === true){
				var variables = str.match(/\$([a-z]|[A-Z]|[0-9])*/g);
				for(var i = 0; i < variables.length; i++){ 
					var v = variables[i];
					var cv= v.replace('$','');
					var vRxp = new RegExp(v, 'g');
					str = str.replace(vRxp, ['(this.', v, ' || 0)'].join(''));
				}				
			}else{
				str = str.replace(/\$/g,'this.');				
			}
			if(opts && opts.debuglog === true){
				console.log(str);
			}
			var result;
			try { result = eval(str); } catch(e) { result = 'err'; }
			if(!isFinite(result)){ 
				if(opts && opts.allowStrings){
				}else{
					result = 'err';					
				}
			}
			if(r){ this.__add__(r, result); }
			return result;
		}
		this.__add__ = function(k, v){
			if(k && k[0] == '$'){ k = k.slice(1); }
			this[k] = v;
			return v;
		}
		this.__get__ = function(k){
			if(k && k[0] == '$'){ k = k.slice(1); }
			return this[k];
		}
		return this;
	}
	function pv(k, v){ // process variable
		return pn(this.calcScope.__add__(k, v));
	}
	function pn(n){ //process number
		if(isFinite(n)){
			return Math.round(100*n)/100;
		}
		return n;
	}
}