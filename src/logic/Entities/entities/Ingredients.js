const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/ingredients");

class Ingredients extends Base{
	
	constructor(){
		super("ingredients", EntitySchema);
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

module.exports = Ingredients;