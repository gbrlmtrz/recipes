const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/utensils");
const { ObjectID } = require('mongodb');

const { _requester } = require("../index");

class Utensils extends Base{
	
	constructor(){
		super("utensils", EntitySchema, 30 * 24 * 60 * 60);
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
				{ utensils : { $in : { deletedIDs } } },
				{	
					$set : { enabled : false },
					$pull : { 
						utensils : { $in : deletedIDs }
					}
				},
				{upsert : false} 
			)
		})
		.catch(console.error)
	}
}

module.exports = Utensils;