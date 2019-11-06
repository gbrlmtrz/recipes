const Database = require('./_Database');
const Response = require('./_Response');
const { ObjectID } = require('mongodb');
const {makeData, makeFind} = require('../helpers/bodyMakers');
const Lang = require('../langs/es.json');
const { getRedis } = require("../../redis");
const pub = getRedis("writer");
const sub = getRedis("subber");
const cacheCallbacks = new Map();
const busterCallbacks = new Map();

sub.subscribe('cache');
sub.subscribe('buster');

sub.on("message", function(channel, message){
	switch(channel){
		case "cache":
			const pieces = message.split("_");
			
			if(cacheCallbacks.has(pieces[0])){
				const items = cacheCallbacks.get(pieces[0]);
				const l = items.length;
				
				for(let i = 0; i < l; i++)
					items[i](pieces[1]);
			}
			break;
		case "buster":
			const payload = JSON.parse(message);
			
			if(busterCallbacks.has(pieces[0])){
				const items = busterCallbacks.get(pieces[0]);
				const l = items.length;
				
				for(let i = 0; i < l; i++)
					items[i](payload.item);
			}
			break;
	}
});


class Base extends Database{

	constructor(collection, schema, ttl = 0){
		super(collection, schema);
		this.ttl = ttl;
		this._cache = new Map();
		
		if(cacheCallbacks.has(this.collection))
			cacheCallbacks.get(this.collection).push(this.onCacheCallback.bind(this));
		else
			cacheCallbacks.set(this.collection, [this.onCacheCallback.bind(this)]);
		
		if(busterCallbacks.has(this.collection))
			busterCallbacks.get(this.collection).push(this.onBusterCallback.bind(this));
		else
			busterCallbacks.set(this.collection, [this.onBusterCallback.bind(this)]);
	}
	
	onBusterCallback(payload){
		const key = new ObjectID(payload._id).toHexString();
		
		if(this._cache.has(key)){
			this._cache.set(key, {
				item : payload,
				cachedAt : Date.now()
			});
		}
		
	}
	
	onCacheCallback(message){
		if(message == "all"){
			this._cache.clear();
		}else if(this._cache.has(message)){
			this._cache.delete(message);
		}
	}
	
	setCache(item, bust = false){
		if(this.ttl == 0) return;
		
		const key = new ObjectID(item._id).toHexString();
		
		this._cache.set(key, {
			item : item,
			cachedAt : Date.now(),
		});
		
		pub.set(`${this.collection}_${key}`, JSON.stringify(item), "EX", this.ttl);
		
		if(bust){
			pub.publish('buster', JSON.stringify({
				collection : this.collection,
				item : item
			}));
		}
	}
	
	getCached(_id = ''){
		
		if(this.ttl == 0){
			return Promise.resolve(new Response(false));
		}
		
		let key = new ObjectID(_id).toHexString();
		
		if(this._cache.has(key)){
			
			if(Date.now() - this._cache.get(key).cachedAt < (this.ttl * 1000)){
				this._cache.get(key).cachedAt = Date.now();
				
				pub.expire(`${this.collection}_${key}`, this.ttl);
				return Promise.resolve(new Response(true, this._cache.get(key).item));
			}else{
				this._cache.delete(key);
			}
		}
		
		return new Promise((resolve, reject) => {			
			pub.get(`${this.collection}_${key}`, (err, data) => {
				if(err){
					console.log("err", err);
					reject(new Response(false));
					return;
				}
				
				if(data){					
					const r = JSON.parse(data);
					
					this._cache.set(key, {
						item : r,
						cachedAt : Date.now(),
					});
					resolve(new Response(true, r));
				}else{
					resolve(new Response(false, null));
				}
			});
		});
	}
	
	processInlineBody(schema, body, data){
		for(let key in body){
			this.getInlineValue(schema, key, body[key], data);
		}
	}
	
	processBody(schema, body, data){
		for(let key in body){
			let parts, name, action;
			if(key !== "_id"){
				parts = key.split("_");
				name = parts[0] || "_id";
				action = parts[1];
			}else{
				name = key;
				action = "";
			}
			this.getValue(schema, name, body[key], action, data);
		}
	}
	
	makeFind(body, schema){
		return makeFind(schema || this.schema, body);
	}
	
	makeData(body, schema){
		return makeData(schema || this.schema, body);
	}
		
	deleteFiles(files){
		if(!Array.isArray(files))
			files = [files];
		
		for(const file of files)
			FileUtils.deleteFile(file, true);
	}
	
	processInline(lang = Lang, item){
		
		const promises = [], keys = [];
		let newItem = {};
		this.processInlineBody(this.schema, item, newItem);
		
		for(const key in this.schema){
			if(this.schema[key]._$linkedWith){
				keys.push(key);
				promises.push(this.schema[key]._$linkedWith.doSelectOneInline(lang, item[key]));
			}
		}
		
		return Promise.all(promises)
		.then(results => {
			for(let key in results){
				if(results[key].success)
					newItem[keys[key]] = results[key].item;
			}
		
			return newItem;
		});
	}
	
	process(item, lang = Lang){
		const promises = [], keys = [];
		
		for(const key in this.schema){
			if(this.schema[key]._$linkedWith && item[key] !== undefined){
				keys.push(key);
				promises.push(this.schema[key]._$linkedWith.doSelectOneFull(item[key], lang));
			}
		}
		
		return Promise.all(promises)
		.then(results => {
			for(let key in results){
				if(results[key].success)
					item[keys[key]] = results[key].item;
			}
			return item;
		});
	}
	
	preInsert(data = {}, lang = Lang){
		return Promise.resolve(new Response(true, data));
	}
	
	postInsert(response, data = {}, lang = Lang){
		if(response.success)
			this.setCache(response.item);
		
		return Promise.resolve(response);
	}

	checkFieldsForInsert(data = {}, lang = Lang, schema){
		if(Object.keys(data).length == 0){
			return Promise.reject(new Response(false, lang.emptyBodyError));
		}
		
		
		return new Promise(async (resolve, reject) => {
			
			//ToDo check for arrays and objects too, ie subdocuments
			
			for(const key in data){
				if(schema.hasOwnProperty(key)){
					
					if(schema[key].hasOwnProperty("_$linkedWith")){
						let arr;
						
						if(Array.isArray(data[key]))
							arr = data[key];
						else
							arr = [data[key]];
						
						for(const piece of arr){
							let r = await schema[key]._$linkedWith.count({_id : piece}, lang);
							if(!r.success || r.item == 0){
								reject(new Response(false, lang[this.collection][schema[key]._$linkedWithMes]));
								return;
							}
						}
					}
					
					if(schema[key].hasOwnProperty("_$unique")){
						let r = await this.count({[key] : data[key]}, lang);
						if(r.success && r.item > 0){
							reject(new Response(false, lang[this.collection][schema[key]._$unique]));
							return;
						}
					}
				}
			}
						
			for(const key in schema){
				if(schema[key].hasOwnProperty("_$insertRequired") && !data.hasOwnProperty(key)){
					reject(new Response(false, lang[this.collection][schema[key]._$insertRequired]));
					return;
				}
			}
			
			
			if(Object.keys(data).length == 0){
				reject(new Response(false, lang.emptyBodyError));
				return;
			}
			
			resolve(new Response(true, data));
		});
	}
	
	doInsert(body = {}, lang = Lang){

		const s = Date.now();
		return this.makeData(body)
		.then(data => { 
			console.log("total", s, Date.now(), Date.now() - s);
			return this.preInsert(data, lang);})
		.then(preInsertR => this.checkFieldsForInsert(preInsertR.item, lang, this.schema))
		.then(checkR => {
			checkR.item.inserted = Date.now();
			
			return this.insertOne(checkR.item, lang)
					.then((response) => this.postInsert(response, checkR.item, lang));
		});
	}
	
	preUpdate(oldBody = {}, data = {}, lang = Lang){
		return Promise.resolve(new Response(true, data));
	}
	
	postUpdate(response, oldBody = {}, data = {}, lang = Lang){
		//response.item = {...oldBody, ...data};
		this.setCache(response.item, true);
		return Promise.resolve(response);
	}
	
	checkFieldsForUpdate(oldBody = {}, newBody = {}, lang = {}, schema){
		return new Promise((resolve, reject) => {
			
			for(const key in newBody){
				if(schema.hasOwnProperty(key)){
					
					if(schema[key].hasOwnProperty("_$linkedWith")){
						let arr;
						
						if(Array.isArray(newBody[key]))
							arr = newBody[key];
						else
							arr = [newBody[key]];
						
						for(const piece of arr){							
							let r = schema[key]._$linkedWith.count({_id : piece}, lang);
							if(!r.success || r.item == 0){
								reject(new Response(false, lang[this.collection][schema[key]._$linkedWithMes]));
								return;
							}
						}
					}
					
					if(schema[key].hasOwnProperty("_$unique")){
						let r = this.doCount({[key] : newBody[key], "_id_ne" : oldBody._id}, lang);
						if(r.success && r.item > 0){
							reject(new Response(false, lang[this.collection][schema[key]._$unique]));
							return;
						}
					}
				}
			}
			
			
			if(Object.keys(newBody).length == 0 || Object.keys(query) == 0){
				reject(new Response(false, lang.emptyBodyError));
				return;
			}
			
			resolve(new Response(true, newBody));
		});
	}
	
	doUpdate(oldBody = null, body = {}, lang = Lang){
		if(oldBody == null){ //retrieve based on id, maybe?
			return Promise.reject(new Response(false, lang.mustSendOldBody));
		}
		
		oldBody._id = new ObjectID(oldBody._id);
		
		return this.makeData(body)
		.then(d => this.preUpdate(oldBody, d, lang))
		.then(preR => this.checkFieldsForUpdate(oldBody, preR.item, lang, this.schema))
		.then(checkR => {
			checkR.item.lastUpdate = Date.now();
			
			return this.updateOne({_id : oldBody._id}, {$set : checkR.item}, {upsert : true, returnOriginal : false}, lang)
				.then(response => this.postUpdate(response, oldBody, checkR.item, lang))
		});
	}
	
	preRemove(find = {}, lang = Lang){
		return Promise.resolve(new Response(true, find));
	}
	
	postRemove(response, find, lang = Lang){
		return Promise.resolve(response);
	}
	
	itemRemoval(items = [], lang){
		for(let i = 0; i < items.length; i++){
			pub.publish('cache', `${this.collection}_${items[i]._id}`);
		}
	}
	
	doRemove(filter = {}, lang = Lang){
		
		return this.makeFind(filter)
		.then(find => this.preRemove(find, lang))
		.then(preR => {
			
			if(Object.keys(preR.item) == 0){
				throw new Response(false, lang.emptyBodyError);
			}
			
			return this.select(preR.item, [], -1, -1, {}, lang)
			.then(selectR => {
				
				if(!selectR.success)
					return new Response(false, lang.searchError);
				
				if(selectR.items.length == 0)
					return new Response(false, lang.nothingToRemove);
				
				this.itemRemoval(selectR.items, lang);
				
				return this.deleteMany(preR.item, lang)
				.then(response => this.postRemove(response, preR.item, lang));
			})
		})
	}
	
	doSelect(body = {}, order = ['_id', 1], skip = -1, limit = -1, projection = {}, lang = Lang){
		return this.makeFind(body)
		.then(data => this.select(data, order, skip, limit, projection, lang))
		.then(res => {
			if(res.success && res.items.length > 0 && Object.keys(projection).length == 0){
				for(let i = 0; i < res.items.length; i++){
					this.setCache(res.items[i]);
				}
			}
		
			return res;
		});
	}
	
	doSelectFull(body = {}, order = ['_id', 1], skip = -1, limit = -1, projection = {}, lang = Lang){
		return this.doSelect(body, order, skip, limit, projection, lang)
		.then(res => {
			let promises = [];
			if(res.success && res.items.length > 0){
				promises = res.items.map( (item) => {
					return this.process(item, lang);
				});
			}
			
			return Promise.all(promises)
			.then(items => {
				if(res.success)
					res.items = items;
				return res;
			});
		});
	}
	
	doSelectFullInline(body = {}, order = ['_id', 1], skip = -1, limit = -1, projection = {}, lang = Lang){
		return this.doSelect(body, order, skip, limit, projection, lang)
		.then(res => {
			let promises = [];
			if(res.success && res.items.length > 0){
				promises = res.items.map( (item) => {
					return this.processInline(item, lang);
				});
			}
			
			return Promise.all(promises)
			.then(items => {
				if(res.success)
					res.items = items;
				return res;
			});
		});
	}
	
	async doSelectOne(body, lang = Lang){
		let data;
		
		if(ObjectID.isValid(body)){
			let key = new ObjectID(body);
			data = {_id : key};
		}else if(typeof body == "object"){
			data = await this.makeFind(body);
		}else if(typeof body == "object"){
			throw new Response(false, lang.searchNoBody);
		}
		
		if(Object.keys(data).length == 1 && data.hasOwnProperty("_id")){
			let cached = await this.getCached(data._id);
			if(cached.success)
				return new Response(true, cached.item);
		}
		
		const r = await this.selectOne(data, {}, {}, lang);
		if(r.success)
			this.setCache(r.item);
		
		return r;
	}
	
	async doSelectOneInline(item, lang = Lang){
		if(item === undefined)
			return new Response(false, item);
		
		if(ObjectID.isValid(item)){
			let promise = await this.selectOne({"_id": item}, {}, {}, lang);
			if(!promise.success)
				return new Response(false, item);
			item = promise.item;
		}
		
		let inline = "";
		for(const key in this.schema){
			if(this.schema[key].inline){
				inline += this._inlineParsers[this.schema[key].type](item[key], this.schema[key]) + " ";
			}
		}
		
		return new Response(true, inline.trim());
	}
	
	async doSelectOneFull(item, lang = Lang){
		if(item === undefined)
			return new Response(false, item);
		
		if(ObjectID.isValid(item)){
			item = new ObjectID(item);
			
			let cached = await this.getCached(item);
			if(cached.success)
				return new Response(true, await this.process(cached.item, lang));
			
			let promise = await this.selectOne({"_id": item}, {}, {}, lang);
			
			if(promise.success){
				this.setCache(promise.item);
				return new Response(true, await this.process(promise.item, lang));
			}else return promise;
			
		}else if(typeof item === 'object'){
			return new Response(true, await this.process(item, lang));
		}
	}
	
	doCount(body, lang = Lang){
		return this.makeFind(body)
		.then(data => this.count(data, lang));
	}

}

module.exports = Base;