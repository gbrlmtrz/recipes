const { readFile } = require('fs');
const Ingredients = require("./src/logic/Entities").Ingredients.instance;


readFile('./data.json', 'utf8', (err, d) => {
	
	const data = JSON.parse(d);
	
	/*Ingredients.insertMany(data)
	.then(console.log)
	.catch(console.error);*/	
})