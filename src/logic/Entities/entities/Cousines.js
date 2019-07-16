const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/cousines");

class Cousines extends Base{
	
	constructor(){
		super("cousines", EntitySchema);
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

module.exports = Cousines;