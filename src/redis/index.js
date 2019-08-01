'use strict';
const config = require('config');
const Redis = require('ioredis');
const object = {
	port: config.get("redis.port"),	// Redis port
	host: config.get("redis.host"),	// Redis host
	family: 4						// 4 (IPv4) or 6 (IPv6)
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