/*const Users = require("./src/logic/Entities").Users.instance;

Users.doInsert({
	mail : "gabomartz@gmail.com",
	password : "09101992",
	handle : "gbrlmtrz",
	name : "Gabriel Martínez",
	priv : 1
	
})
.then(console.log)
.catch(console.error)*/

/*const Channels = require("./src/logic/Entities").Channels.instance;

Channels.doInsert({
	ips : ["127.0.0.1", "192.168.10.101"],
	geometry : {
		type : "MultiPoint",
		coordinates : [
			[-71.4553682, 10.4178473]
		]
	},
	state: {
		cid: "123cdaCOD"
	}
})
.then(console.log)
.catch(console.error);*/

/*const Ingredients = require("./src/logic/Entities").Ingredients.instance;

Ingredients.select({ $text : {$search : "atun"} })
.then(console.log)
.catch(console.error);*/

const server = require("./src/server");

server.start();