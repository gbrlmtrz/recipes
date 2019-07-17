const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/recipes");
const { ObjectID } = require('mongodb');
const nanoid = require('nanoid');
const Response = require('../_Response');

const { _requester } = require("../index");

class Recipes extends Base{
	
	constructor(){
		super("recipes", EntitySchema);
		
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
			"translations.recipe" : "text"
		}, {
			default_language: "spanish",
			name : "recetas",
			weights : {
				"translations.name" : 3,
				"translations.recipe" : 1
			}
		});
		super.createIndexes();
	}
	
	checkIngredients(data = {}, lang){
		return new Promise((resolve, reject) => {
			if(Array.isArray(data.ingredients)){
				
				_requester("ingredients")
				.then(async (klass) => {
					
					const IngredientInstance = klass.instance;
					
					for(const key in data.ingredients){
						if(!data.ingredients[key].hasOwnProperty('ingredient') || !ObjectID.isValid(data.ingredients[key].ingredient)){
							reject(new Response(false, lang.recipes.ingredientRequired));
							return;
						}
						
						if(!data.ingredients[key].hasOwnProperty('quantity') || isNaN(data.ingredients[key].quantity)){
							reject(new Response(false, lang.recipes.quantityRequired));
							return;
						}
						
						data.ingredients[key].quantity = parseFloat(data.ingredients[key].quantity);
						
						data.ingredients[key].ingredient = new ObjectID(data.ingredients[key].ingredient);
						
						const ingredientItem = await IngredientInstance.selectOne({_id : data.ingredients[key].ingredient}, {}, [], lang);
						
						if(!ingredientItem.success){
							reject(new Response(false, lang.recipes.ingredientRequired));
							return;
						}
						
						
						data.totalCal = (data.totalCal || 0) + (ingredientItem.item.calories * data.ingredients[key].quantity / data.portions);
						data.totalFat = (data.totalFat || 0) + (ingredientItem.item.totalFat * data.ingredients[key].quantity / data.portions);
						data.totalSaturateFat = (data.totalSaturateFat || 0) + (ingredientItem.item.saturatedFat * data.ingredients[key].quantity / data.portions);
						data.totalCholesterol = (data.totalCholesterol || 0) + (ingredientItem.item.cholesterol * data.ingredients[key].quantity / data.portions);
						data.totalSodium = (data.totalSodium || 0) + (ingredientItem.item.sodium * data.ingredients[key].quantity / data.portions);
						data.totalCarbohydrate = (data.totalCarbohydrate || 0) + (ingredientItem.item.totalCarbohydrate * data.ingredients[key].quantity / data.portions);
						data.totalDietaryFiber = (data.totalDietaryFiber || 0) + (ingredientItem.item.dietaryFiber * data.ingredients[key].quantity / data.portions);
						data.totalSugars = (data.totalSugars || 0) + (ingredientItem.item.sugars * data.ingredients[key].quantity / data.portions);
						data.totalProtein = (data.totalProtein || 0) + (ingredientItem.item.protein * data.ingredients[key].quantity / data.portions);
						data.totalPotassium = (data.totalPotassium || 0) + (ingredientItem.item.potassium * data.ingredients[key].quantity / data.portions);
					}
					resolve(data);
				})
				.catch(reject)
			}else{
				reject(new Response(false, lang.recipes.ingredientsRequired));
				return;
			}
		});
	}
	
	preInsert(data = {}, lang){
		return new Promise((resolve, reject) => {
			
			this.checkIngredients(data, lang)
			.then( data => this.checkDiets(data, lang))
			.then(async () => {
			
				let n, r;
				do{
					n = nanoid();
					try{
						r = await this.count({ friendlyID : n });
					}catch(e){
						reject(e);
						return;
					}
				}while(r.success && r.item > 0);
				
				data.friendlyID = n;
				resolve(data);
			})
			.catch(reject);

		});
	}
	
	preUpdate(oldBody = {}, data = {}, query = {}, lang = Lang){
		
		data.totalCal = 0;
		data.totalFat = 0;
		data.totalSaturateFat = 0;
		data.totalCholesterol = 0;
		data.totalSodium = 0;
		data.totalCarbohydrate = 0;
		data.totalDietaryFiber = 0;
		data.totalSugars = 0;
		data.totalProtein = 0;
		data.totalPotassium = 0;
	
		return this.checkIngredients(data, lang)
		.then(data => this.checkDiets(data, lang));
	}
	
}

module.exports = Recipes;