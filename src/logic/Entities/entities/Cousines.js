const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/cousines");

const { _requester } = require("../index");

class Cousines extends Base{
	
	constructor(){
		super("cousines", EntitySchema, 30 * 24 * 60 * 60);
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
	
	
	itemRemoval(items = [], lang = {}){
		const deletedIDs = [];
		for(const utensil of items){
			deletedIDs.push(new ObjectID(utensil._id));
		}
		
		_requester("Recipes")
		.then((klass) => {
			return klass.instance.updateMany(
				{ cousine : { $in : { deletedIDs } } },
				{
					$unset : { cousine : 1 },
				},
				{upsert : false} 
			)
		})
		.catch(console.error)
	}
	
}

module.exports = Cousines;