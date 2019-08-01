const Base = require('../_Base');
const { EntitySchema } = require("../../schemas/ingredientAlternatives");

class IngredientAlternatives extends Base{
	
	constructor(){
		super("ingredientAlternatives", EntitySchema, 30 * 24 * 60 * 60);
	}
	
}

module.exports = IngredientAlternatives;