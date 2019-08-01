const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/ingredients");
const { ObjectID } = require('mongodb');

const { _requester } = require("../index");

class Ingredients extends Base{
	
	constructor(){
		super("ingredients", EntitySchema, 30 * 24 * 60 * 60);
		this.schema.generic._$linkedWith = this;
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
	
	postUpdate(response, oldBody = {}, data = {}, query = {}, lang = {}){
		if(!response.success) Promise.resolve(response);
		
		return new Promise((resolve, reject) => {
			
			_requester("Recipes")
			.then((klass) => {
				return klass.instance.select({"ingredients.ingredient" : { $in : new ObjectID(oldBody._id) }}, [], -1, -1, {}, lang)
				.then( items => {
					if(!items.success)
						return Promise.resolve(response);
					
					const promises = [];
					
					for(const recipe in items)
						promises.push(klass.instance.doUpdate(recipe, {ingredients : recipe.ingredients}, {_id : new ObjectID(recipe._id)}, lang));
				
					return Promise.all(promises);
				});
			})
			.catch((error) => {
				console.error(error);
				resolve(new Response(false, lang.ingredients.updatedButRecipesNotModified));
			});
			
		});
	}
	
	itemRemoval(items = [], lang = {}){
		const deletedIDs = [];
		for(const ingredient of items){
			deletedIDs.push(new ObjectID(ingredient._id));
		}
		
		const updateIDs = [];
		const recipes = [];
		
		_requester("Recipes")
		.then((klass) => {
			return klass.instance.select({"ingredients.ingredient" : { $in : deletedIDs }}, [], -1, -1, {}, lang)
			.then((items) => {
			
				if(items.success && items.length > 0){
					recipes = item.items;
					
					for(const recipe in items.items){
						updateIDs.push(new ObjectID(recipe._id));
					}
				
					return klass.updateMany(
						{_id : { $in : updateIDs }},
						{	
							$set : { enabled : false },
							$pull : { 
								ingredients : { 
									ingredient : { $in : deletedIDs }
								}
							}
						},
						{upsert : false}
					);
				}else
					return {success : false};
			})
			.then(updateResult => {
				if(updateResult.success){
					const promises = [];
					
					for(const recipe of recipes){
						
						const ingredients = [];
						
						for(const ingredient of recipe.ingredients){
							
							let add = true;
							
							for(const deleted of deletedIDs){
								if(new ObjectID(ingredient.ingredient).equals(deleted)){
									add = false;
									break;
								}
							}
							
							if(add)
								ingredients.push(ingredient);
						}
						
						klass.instance
						.doUpdate(recipe, {_id : new ObjectID(recipe._id)}, {ingredients}, lang)
						.catch(console.error);
					}
				}
			})
		})
		.catch(console.error)
	}
	
}

module.exports = Ingredients;