'use strict';
const config = require('config');
const Redis = require('ioredis');
const targetError = "READONLY";

const object = {
	...config.get("redis"), 
	reconnectOnError: function(err) {
		if (err.message.slice(0, targetError.length) === targetError) {
		  return true; 
		}
	}
};

const eventCounts = {};
const redisInstances = {};

module.exports = {
	getRedis: function(intention){
		if(intention){
			if(!redisInstances.hasOwnProperty(intention)){
				redisInstances[intention] = new Redis(object);
			}
			return redisInstances[intention];
		}
		return new Redis(object);
	}
};