'use strict';
const { existsSync, createReadStream, readFileSync, readdirSync, access } = require('fs');
const fastify = require('fastify');
const path = require('path');
const schemas = require('../logic/schemas');
const { _requester } = require('../logic/Entities');
const routeHelper = require('./utils/routeHelper');
const authMaker = require('./utils/authMaker');
const autoauth = require('./preHandlers/autoauth');

const getRedirector = function(){
	const redirect = fastify({});

	redirect.route({
		url: '/*',
		method: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS'],
		handler: (req, res) => {
			const { host } = req.headers;
			res.redirect(301, `https://${host}${req.raw.url}`);
			return;
		}
	});
	return Promise.resolve(redirect);
};

const getApp = function(){
	
	return new Promise(async function(resolve, reject){
		const app = fastify({
			/*https: {
				allowHTTP1: true, 
				key: readFileSync(path.join(__dirname, '..', '..', 'ssl', 'server.key')),
				cert: readFileSync(path.join(__dirname, '..', '..', 'ssl', 'server.crt'))
			}*/
		});

		app.register(require('fastify-compress'), {threshold: 2048});
		app.register(require('fastify-static'), {root: path.join(__dirname, 'static'), prefix: '/static/'});

		/*app.register(require('fastify-cors'), { origin: '*', optionsSuccessStatus: 200 });*/

		app.decorateRequest('lang', {});
		app.addHook('preHandler', require('./preHandlers/locale'));

		const routeFiles = readdirSync(`${__dirname}/router`);

		for(const route of routeFiles){
			if(route.charAt(0) != "_" && route != "index.js"){
				const name = route.slice(0, -3);
				app.register(require(`./router/${name}`), {prefix: `/${name}`});
			}
		}


		for(const key in schemas){
			if(schemas[key].hasOwnProperty('routes')){
				const routes = [];
				let addAuth = false;
				
				if(existsSync(`${__dirname}/router/_${key}.js`)){
					const module = require(`./router/_${key}.js`);
					
					if(module.addAuth) addAuth = true;
					const arr = Array.isArray(module) ? module : module.routes;
					
					for(const route of arr){
						routes.push(route);
					}
				}
				
				for(const routeDef of schemas[key].routes){
					let addRoute = true;
					for(const route in routes){
						if(route.url == routeDef.url && route.method == routeDef.method){
							addRoute = false;
							break;
						}
					}
					if(addRoute){
						
						const Entity = await _requester(key);
						
						const obj = {
							url: routeDef.url,
							method: routeDef.method,
							schema: routeDef.schema,
							handler: routeHelper(routeDef.entityFuntion, Entity.instance)
						};
						
						if(routeDef.hasOwnProperty("privs") && Array.isArray(routeDef.privs) && routeDef.privs > 0){
							addAuth = true;
							obj.beforeHandler = authMaker(routeDef.privs);
						}
						
						routes.push(obj);
					}
				}
				
				app.register(async function(route, opts, next){
					
					if(addAuth){				
						route.decorateRequest('user', { logged : false });
						route.addHook('preHandler', autoauth);
					}
					
					for(const r of routes){
						route.route(r);
					}
					
				}, {prefix: `/${key}`});
			}	
		}
		
		app.get('/*', (req, reply) => {
			reply.sendFile('index.html');
		});
		
		resolve(app);
	});
}

module.exports = {
	start(){
		
		getApp()
		.then(app => app.listen(8082, '0.0.0.0'))
		.then(addr => console.log(`Server listening on ${addr} on proccess ${process.pid}`))
		.catch(console.error);
		
		/*getRedirector()
		.then(app => app.listen(8080, '0.0.0.0'))
		.then(addr => console.log(`Server listening on ${addr} on proccess ${process.pid}`))
		.catch(console.error);*/
		
		
	}
};