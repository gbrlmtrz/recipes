const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/diets");
const nanoid = require('nanoid');

const { _requester } = require("../index");

class Diets extends Base{
	
	constructor(){
		super("diets", EntitySchema);
		
		_requester("Ingredients")
		.then( i => { 
			this.schema.requiredIngredient._$linkedWith = i.instance;
			this.schema.withoutIngredient._$linkedWith = i.instance;
		})
		.catch(e => { throw e });
	}
	
	createIndexes(){
		this.createIndex({
			"translations.name" : "text"
		}, {
			default_language: "spanish",
			name : "name"
		});
		super.createIndexes();
	}
	
}

module.exports = Diets;