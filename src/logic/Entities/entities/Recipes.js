const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/recipes");
const { ObjectID } = require('mongodb');
const nanoid = require('nanoid');
const Response = require('../_Response');

const { _requester } = require("../index");

class Recipes extends Base{
	
	constructor(){
		super("recipes", EntitySchema, 30 * 24 * 60 * 60);
		
		this.schema.basedOn._$linkedWith = this;
		_requester("Cousines")
		.then( i => { 
			this.schema.cousine._$linkedWith = i.instance;
			return _requester("Diets")
		})
		.then( i => { 
			this.schema.diets._$linkedWith = i.instance;
			return _requester("Utensils")
		})
		.then( i => this.schema.utensils._$linkedWith = i.instance)
		.catch(e => { throw e });
	}
	
	createIndexes(){
		this.createIndex({
			"translations.name" : "text",
			"translations.recipe" : "text",
			"translations.tags" : "text",
		}, {
			default_language: "spanish",
			name : "recetas",
			weights : {
				"translations.name" : 5,
				"translations.recipe" : 2,
				"translations.tags" : 1
			}
		});
		super.createIndexes();
	}
	
	process(item = {}, lang = {}){
		
		return _requester("ingredients")
		.then((klass) => {
			const promises = [];
			
			for(const ingredient of item.ingredients){
				promises.push(klass.instance.doSelectOneFull(new ObjectID(ingredient._id), lang));
			}
			
			return Promise.all(promises);
		})
		.then(results => {
			for(const key in results){
				if(results[key].sucess){
					item.ingredients[key].ingredient = results[key].item;
				}else{
					delete item.ingredients[key];
				}
			}
			return super.process(item, lang);
		})
	}
	
	checkDiets(data = {}, ingredients = [], lang){
		
		return _requester("diets")
		.then((klass) => {
			const DietsInstance = klass.instance;
			
			const ingredientTypes = [];
			const ingredientIDs = [];
			
			for(const ingredient of ingredients){
				const oid = new ObjectID(ingredient._id);
				
				if(ingredientIDs.indexOf(oid) == -1)
					ingredientIDs.push(oid);
				
				if(ingredientTypes.indexOf(ingredient.type) == -1)
					ingredientTypes.push(ingredient.type);
			}
			
			
			data.ingredientTypes = ingredientTypes;
			data.ingredientCount = ingredientIDs.length;
			
			data.utensilCount = data.utensils.length;
			
			
			//todo fix requirements
			const query = {
				//requiredIngredient : { $all : ingredientIDs },
				withoutIngredient : { $nin : ingredientIDs },
				
				maxIngredients : {$gte : ingredients.length},
				minIngredients : {$lte : ingredients.length},
				
				//requiredIngredientType : { $all : ingredientTypes },
				withoutIngredientType : { $nin : ingredientTypes },
				
				//requiredUtensil : { $all : data.utensils },
				withoutUtensil : { $nin : data.utensils },
				maxUtensils : {$gte : data.utensils.length},
				minUtensils : {$lte : data.utensils.length},
				
				maxTime : {$gte : data.time},
				minTime : {$lte : data.time},
				
				"nf.maxCal" : {$gte : data.nf.totalCal},
				"nf.minCal" : {$lte : data.nf.totalCal},
				
				"nf.maxFat" : {$gte : data.nf.totalFat},
				"nf.minFat" : {$lte : data.nf.totalFat},
				
				"nf.maxSaturatedFat" : {$gte : data.nf.totalSaturatedFat},
				"nf.minSaturatedFat" : {$lte : data.nf.totalSaturatedFat},
				
				"nf.maxCholesterol" : {$gte : data.nf.totalCholesterol},
				"nf.minCholesterol" : {$lte : data.nf.totalCholesterol},
				
				"nf.minSodium" : {$lte : data.nf.totalSodium},
				"nf.maxSodium" : {$gte : data.nf.totalSodium},
				
				"nf.minCarbohydrate" : {$lte : data.nf.totalCarbohydrate},
				"nf.maxCarbohydrate" : {$gte : data.nf.totalCarbohydrate},
				
				"nf.minDietaryFiber" : {$lte : data.nf.totalDietaryFiber},
				"nf.maxDietaryFiber" : {$gte : data.nf.totalDietaryFiber},
				
				"nf.minSugars" : {$lte : data.nf.totalSugars},
				"nf.maxSugars" : {$gte : data.nf.totalSugars},
				
				"nf.minProtein" : {$lte : data.nf.totalProtein},
				"nf.maxProtein" : {$gte : data.nf.totalProtein},
				
				"nf.minPotassium" : {$lte : data.nf.totalPotassium},
				"nf.maxPotassium" : {$gte : data.nf.totalPotassium}
			};
			
			return DietsInstance.select(query, [], -1, -1, {_id : 1}, lang);
		})
		.then(response => {
			data.diets = [];
			if(response.success && response.items.length > 0){
				for(const diet of response.items)
					data.diets.push(new ObjectID(diet._id));
			}
			return data;
		});
		
	}
	
	checkIngredients(data = {}, lang){
		if(!Array.isArray(data.ingredients) || data.ingredients.length == 0)
			return Promise.reject(new Response(false, lang.recipes.ingredientsRequired));
		
		if(!Array.isArray(data.utensils) || data.utensils.length == 0)
			return Promise.reject(new Response(false, lang.recipes.utensilRequired));
		
		
		const ingredients = [];
		const tagKeys = {};
		data.nf = {};
			
		return _requester("ingredients")
		.then((klass) => {
			
			const IngredientInstance = klass.instance;
			const promises = [];
			
			for(const key in data.ingredients){
				if(!data.ingredients[key].hasOwnProperty('ingredient') || !ObjectID.isValid(data.ingredients[key].ingredient)){
					throw new Response(false, lang.recipes.ingredientRequired);
				}
				
				if(!data.ingredients[key].hasOwnProperty('quantity') || isNaN(data.ingredients[key].quantity)){
					throw new Response(false, lang.recipes.quantityRequired);
				}
				
				data.ingredients[key].quantity = parseFloat(data.ingredients[key].quantity);
				
				data.ingredients[key].ingredient = new ObjectID(data.ingredients[key].ingredient);
				promises.push(IngredientInstance.doSelectOne(data.ingredients[key].ingredient, lang));
			}
			
			return Promise.all(promises);
		})
		.then((results) => {
			for(const key in results){
				
				const ingredientItem = results[key];
				
				if(!ingredientItem.success)
					throw new Response(false, lang.recipes.ingredientRequired);		

				ingredients.push(ingredientItem.item);

				data.nf.totalCal = (data.nf.totalCal || 0) + (ingredientItem.item.calories * data.ingredients[key].quantity / data.portions);
				data.nf.totalFat = (data.nf.totalFat || 0) + (ingredientItem.item.totalFat * data.ingredients[key].quantity / data.portions);
				data.nf.totalSaturatedFat = (data.nf.totalSaturateFat || 0) + (ingredientItem.item.saturatedFat * data.ingredients[key].quantity / data.portions);
				data.nf.totalCholesterol = (data.nf.totalCholesterol || 0) + (ingredientItem.item.cholesterol * data.ingredients[key].quantity / data.portions);
				data.nf.totalSodium = (data.nf.totalSodium || 0) + (ingredientItem.item.sodium * data.ingredients[key].quantity / data.portions);
				data.nf.totalCarbohydrate = (data.nf.totalCarbohydrate || 0) + (ingredientItem.item.totalCarbohydrate * data.ingredients[key].quantity / data.portions);
				data.nf.totalDietaryFiber = (data.nf.totalDietaryFiber || 0) + (ingredientItem.item.dietaryFiber * data.ingredients[key].quantity / data.portions);
				data.nf.totalSugars = (data.nf.totalSugars || 0) + (ingredientItem.item.sugars * data.ingredients[key].quantity / data.portions);
				data.nf.totalProtein = (data.nf.totalProtein || 0) + (ingredientItem.item.protein * data.ingredients[key].quantity / data.portions);
				data.nf.totalPotassium = (data.nf.totalPotassium || 0) + (ingredientItem.item.potassium * data.ingredients[key].quantity / data.portions);
			}
			
			for(const ingredient of ingredients){
				for(const language of ingredient.translations){
					if(tagKeys.hasOwnProperty(language.language))
						tagKeys[language.language].push(language.name);
					else
						tagKeys[language.language] = [language.name];
				}
			}
			
			
			for(const key in data.translations){
				if(tagKeys.hasOwnProperty(data.translations[key].language)){
					data.translations[key].tags = tagKeys[data.translations[key].language];
				}
			}
			
			return {data, ingredients};
		});
	}
	
	preInsert(data = {}, lang){
		return new Promise((resolve, reject) => {
			
			this.checkIngredients(data, lang)
			.then( ({data, ingredients}) => this.checkDiets(data, ingredients, lang))
			.then(async (d) => {
				let n, r;
				do{
					n = nanoid(10);
					try{
						r = await this.count({ friendlyID : n });
					}catch(e){
						reject(e);
						return;
					}
				}while(r.success && r.item > 0);
				
				d.friendlyID = n;
				resolve(new Response(true, d));
			})
			.catch(reject);

		});
	}
	
	preUpdate(oldBody = {}, data = {}, query = {}, lang = Lang){
		
		data.nf = {};
		
		if(!data.hasOwnProperty("ingredients") || !Array.isArray(data.ingredients)){
			
			if(!oldBody.hasOwnProperty("ingredients") || !Array.isArray(oldBody.ingredients))
				return Promise.reject(new Response(false, lang.recipes.ingredientsRequired))
			
			data.ingredients = oldBody.ingredients;
			
		}
	
		return this.checkIngredients(data, lang)
		.then( (d, ingredients) => this.checkDiets(data, ingredients, lang));
	}
	
}

module.exports = Recipes;