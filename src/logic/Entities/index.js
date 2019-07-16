'use strict';
const {readdirSync} = require("fs");
const entities = readdirSync(`${__dirname}/entities`);

const _requesterMap = new Map();

const exp = {
	_requester : function(key){ //trying real hard to just keep one instance
		
		key = key.toLowerCase();
		
		if(exp.hasOwnProperty(key)){
			return Promise.resolve(exp[key]);
		}
		
		return new Promise( (resolve, reject) => {
			if(!_requesterMap.has(key))
				_requesterMap.set(key, [resolve]);
			else
				_requesterMap.get(key).push(resolve);
		});
	}
};

module.exports = exp;

for(const entity of entities){
	if(entity.charAt(0) != "_" && entity != "index.js"){
		
		const name = entity.slice(0, -3);
		const klass = require(`${__dirname}/entities/${name}`);
		const obj = {
			klass : klass,
			instance : new klass()
		};
		
		const lowercaseName = name.toLowerCase();
		
		exp[name] = obj;
		exp[lowercaseName] = obj;
		
		if(_requesterMap.has(lowercaseName)){
			_requesterMap.get(lowercaseName).forEach( resolve => resolve(exp[lowercaseName]) );
		}
	}
}

_requesterMap.forEach( (value, key) => {
	value.forEach( resolve => resolve(exp[key]) );
	_requesterMap.set(key, []);
})
