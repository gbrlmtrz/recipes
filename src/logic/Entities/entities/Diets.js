const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/diets");
const nanoid = require('nanoid');
const { ObjectID } = require('mongodb');

const { _requester } = require("../index");

class Diets extends Base{
	
	constructor(){
		super("diets", EntitySchema, 30 * 24 * 60 * 60);
		
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
	
	itemRemoval(items = [], lang = {}){
		const deletedIDs = [];
		for(const diet of items){
			deletedIDs.push(new ObjectID(diet._id));
		}
		
		
		_requester("Recipes")
		.then((klass) => {
			return klass.instance.updateMany(
				{ diets : { $in : { deletedIDs } } },
				{	
					$pull : { 
						diets : { $in : deletedIDs }
					}
				},
				{upsert : false} 
			)
		})
		.catch(console.error)
	}

	postInsert(response, data = {}, lang = {}){
		
		if(!response.success)
			return super.postInsert(response, data, lang);
		
		return _requester("Recipes")
		.then((klass) => {
			
			const query = {
				ingredientCount : { $gte : data.minIngredients, $lte : data.maxIngredients },
				
				utensilsCount : { $gte : data.minUtensils, $lte : data.maxUtensils },
				
				time : { $gte : data.minTime, $lte : data.maxTime},
				
				"nf.totalCal" : {$gte : data.nf.minCal, $lte : data.nf.maxCal},
				
				"nf.totalFat" : {$gte : data.nf.minFat, $lte : data.nf.maxFat},
				
				"nf.totalSaturatedFat" : {$gte : data.nf.minSaturatedFat, $lte : data.nf.maxSaturatedFat},
				
				"nf.totalCholesterol" : {$gte : data.nf.minCholesterol, $lte : data.nf.maxCholesterol},
				
				"nf.totalSodium" : {$gte : data.nf.minSodium, $lte : data.nf.minSodium},
				
				"nf.totalCarbohydrate" : {$gte : data.nf.minCarbohydrate, $lte : data.nf.minCarbohydrate},
				
				"nf.totalDietaryFiber" : {$gte : data.nf.minDietaryFiber, $lte : data.nf.minDietaryFiber},
				
				"nf.totalSugars" : {$gte : data.nf.minSugars, $lte : data.nf.minSugars},
				
				"nf.totalProtein" : {$gte : data.nf.minProtein, $lte : data.nf.minProtein},
				
				"nf.totalPotassium" : {$gte : data.nf.minPotassium, $lte : data.nf.minPotassium}
			};
			
			if(data.requiredIngredient.length > 0){
				query.ingredients = { $all : data.requiredIngredient };
			}
			
			if(data.withoutIngredient.length > 0){
				if(!query.hasOwnProperty("ingredients"))
					query.ingredients = {};
				
				query.ingredients.$nin = data.withoutIngredient;
			}
			
			if(data.requiredIngredientType.length > 0){
				query.ingredientTypes = { $all : data.requiredIngredientType };
			}
			
			if(data.withoutIngredientType.length > 0){
				if(!query.hasOwnProperty("ingredientTypes"))
					query.ingredientTypes = {};
				
				query.ingredientTypes.$nin = data.withoutIngredientType;
			}
			
			if(data.requiredUtensil.length > 0){
				query.utensils = { $all : data.requiredUtensil };
			}
			
			if(data.withoutUtensil.length > 0){
				if(!query.hasOwnProperty("utensils"))
					query.utensils = {};
				
				query.utensils.$nin = data.withoutUtensil;
			}
			
			klass.instance.updateMany(
				query,
				{	
					$push : { 
						diets : new ObjectID(response.item._id)
					}
				},
				{upsert : false} 
			)
			.then((r) => {
				console.log("updateRecipesByDietResults", r);
			})
			.catch((e) => {
				console.log(e);
			});
			
			return super.postInsert(response, data, lang);
		});
	}
}

module.exports = Diets;