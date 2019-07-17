const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/utensils");

class Utensils extends Base{
	
	constructor(){
		super("utensils", EntitySchema);
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

module.exports = Utensils;