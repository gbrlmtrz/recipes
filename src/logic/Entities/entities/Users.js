const Base = require('../_Base');
const Response = require('../_Response');
const jwt = require('jsonwebtoken');
const config = require('config');
const { EntitySchema } = require("../../schemas/users");
const argon2 = require('argon2');

class Users extends Base{
	
	constructor(){
		super("users", EntitySchema, 24 * 60 * 60);
	}
	
	isAdmin(user){
		return user != null && user.priv == 1;
	}
	
	isLogged(user){
		return user != null && user.logged;
	}
	
	hashPass(pass, lang){
		return new Promise((resolve, reject) => {
			argon2.hash(pass, {
				type: argon2.argon2i,
				hashLength: 40
			})
			.then(resolve)
			.catch(e => {
				console.log(e);
				reject(new Response(false, lang.users.encryptError));
			})
		});
	}
	
	compareHashPass(hash, pass, lang){
		return new Promise((resolve, reject) => {
			argon2.verify(hash, pass)
			.then(resolve)
			.catch(err => {
				console.log(err);
				setTimeout(() => {
					reject(new Response(false, lang.users.compareHashError));
				}, Math.floor(Math.random() * (3001 - 500)) + 500);
			});
		});
	}
	
	getJWT(data, days = 1, lang){
		return new Promise( (resolve, reject) => {		
			jwt.sign(data, config.get("Users.JWTSecret"), {expiresIn: parseInt((Date.now() / 1000) + days * 24 * 60 * 60) }, 
			(err, token) => {
				if(err)
					reject(new Response(false, lang.users.JWTError));
				else 
					resolve(token);
			});
		});
	}
	
	checkHash(jwtoken, lang = {}){
		if(jwtoken == null)
			return Promise.resolve(new Response(false, lang.users.pleaseSendAValidToken));
		
		return new Promise((resolve, reject) => {
		
			jwt.verify(jwtoken, config.get("Users.JWTSecret"), (err, decoded) => {
				if(err){
					return reject(new Response(false, lang.users.verifyError));
				}
				
				if(decoded.exp * 1000 < Date.now())
					return reject(new Response(false, lang.users.expiredToken));
				
				if(!decoded._id)
					return reject(new Response(false, lang.users.invalidToken));
				
				this.selectOne({_id: decoded._id}, lang)
				.then(user => {
					if(!user.success)
						return reject(new Response(false, lang.users.invalidToken));
					
					if(!user.item.valid)
						return reject(new Response(false, lang.users.invalidToken));
					
					if(!user.item.enabled)
						return reject(new Response(false, lang.users.invalidToken));
					
					if(decoded.iat * 1000 < user.item.issuedAfter)
						return reject(new Response(false, lang.users.pleaseRenewToken));
					
					resolve(user);
				})
				.catch(reject);
			});
		});
	}
	
	preInsert(data = {}, lang){
		data.valid = true;
		data.enabled = true;
		data.created = Date.now();
		data.lastUpdate = Date.now();
		data.issuedAfter = Date.now();
		
		if(!data.hasOwnProperty("password"))
			return Promise.resolve(new Response(true, data));
		
		return this.hashPass(data.password, lang)
		.then(pass => {
			data.password = pass;
			return new Response(true, data);
		});
	}
	
	preUpdate(oldBody = {}, data = {}, query = {}){
		
		if(!data.hasOwnProperty("password"))
			return Promise.resolve(new Response(true));
		
		return this.hashPass(data.password, lang)
		.then(pass => {
			data.password = pass;
			data.issuedAfter = Date.now();
			return new Response(true, data);
		});
	}
	
	postUpdate(response, oldBody = {}, data = {}, query = {}, lang){
		if(!response.success || !data.hasOwnProperty("password"))
			return super.postUpdate(response, oldBody, data, query, lang);
		
		return this.getJWT({_id : oldBody._id}, config.get("Users.JWTLifeInDays"), lang)
		.then(token => {
			response.token = token;
			response.expires = parseInt((Date.now() / 1000) + config.get("Users.JWTLifeInDays") * 24 * 60 * 60);
			return super.postUpdate(response, oldBody, data, query, lang);
		});
	}
	
}

module.exports = Users;