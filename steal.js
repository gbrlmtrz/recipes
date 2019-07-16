const https = require("https");
const { writeFile } = require("fs");


const bigData = [];
const limit = 116;
let done = 0;

const save = function(){
	writeFile('data.json', JSON.stringify(bigData), 'utf8', (err) => {
		if(err)
			console.log(err);
		console.log("done!");
	});
};

const parseResponse = function(response){
	data = JSON.parse(response);
	for(const food of data.foods){
		const item = {
			translations : [
				{
					language : "es",
					name : food.food_name,
				},
				{
					language : "en",
					name : food.tags.item
				}
			],
			gramToLiter : -1
		};
		
		for(const measure of food.alt_measures){
			
			let m = measure.measure.toLowerCase();
			
			if(m.indexOf(",") >= 0)
				m = m.split(",")[0];
			
			if(m.indexOf("(") >= 0)
				m = m.split("(")[0];
			
			m = m.trim();
			
			switch(m){
				case "mililitro":
				case "mili litro":
				case "millilitre":
				case "ml":
					item.gramToLiter =  (measure.serving_weight / measure.qty) * 1000;
					break;
				case "cdta":
				case "cucharadita":
				case "tspn":
				case "tsp":
				case "teaspoon":
				case "teaspoons":
					item.gramToLiter = (measure.serving_weight / measure.qty) * 202.884;
					break;
				case "cuchara":
				case "cucharas":
				case "spoon":
				case "spoons":
				case "spoonfull":
				case "spoonfulls":
				case "tablespoon":
				case "tablespoons":
				case "cucharada":
				case "cucharadas":
				case "cda":
				case "tb":
				case "tbls":
				case "tbsp":
					item.gramToLiter = (measure.serving_weight / measure.qty) * 67.628;
					break;
				case "oz":
				case "onza":
				case "onzas":
				case "ounces":
				case "ounce":
					item.gramToLiter = (measure.serving_weight / measure.qty) * 33.814;
					break;
				case "vaso":
				case "vasos":
				case "glasses":
				case "glass":
					item.gramToLiter = (measure.serving_weight / measure.qty) * 5;
					break;
				case "taza":
				case "cup":
				case "cups":
				case "tazas":
					item.gramToLiter = (measure.serving_weight / measure.qty) * 4.227;
					break;
				case "pint":
				case "pinta":
				case "pints":
				case "pintas":
				case "pt":
					item.gramToLiter = (measure.serving_weight / measure.qty) * 2.113;
					break;
				case "l":
				case "litro":
				case "litros":
				case "litre":
				case "litres":
					item.gramToLiter =  measure.serving_weight / measure.qty;
					break;
				case "gal":
				case "gallon":
				case "galón":
				case "galon":
				case "gallons":
				case "galones":
					item.gramToLiter =  (measure.serving_weight / measure.qty) / 3.785;
					break;
			}
			
			
			if(item.gramToLiter != -1) 
				break;
		}
		
		let grams;
		
		food.serving_unit = food.serving_unit.toLowerCase();
		
		if(
			food.serving_unit == "grams" ||
			food.serving_unit == "gramos" ||
			food.serving_unit == "gramo" ||
			food.serving_unit == "gram" ||
			food.serving_unit == "g"
		){
			grams = food.serving_weight_grams;
		}else
			grams = food.serving_weight_grams / food.serving_qty;
		
		item.calories = food.nf_calories / grams; //kcal
		item.totalFat = food.nf_total_fat / grams; //g
		item.saturatedFat = food.nf_saturated_fat / grams; //g
		item.cholesterol = food.nf_cholesterol / grams; //mg
		item.sodium = food.nf_sodium / grams; //mg
		item.totalCarbohydrate = food.nf_total_carbohydrate / grams; //g
		item.dietaryFiber = food.nf_dietary_fiber / grams; //g
		item.sugars = food.nf_sugars / grams; //g
		item.protein = food.nf_protein / grams; //g
		item.potassium = food.nf_potassium / grams; //mg
		
		
		item.food_group = food.tags.food_group;
		item.meal_type = food.meal_type;
		bigData.push(item);
	}
	
};

const request = function(page){
	
	console.log(`doing page ${page}`);
	
	https.get(`https://www.nutritionix.com/nixapi/search/es_ES?page=${page}`, (resp) => {
		
		let data = '';

		resp.on('data', (chunk) => {
			data += chunk;
		});
		
		resp.on('end', () => {
			console.log(`page ${page} is done`);
			parseResponse(data);
			done++;
			if(done == limit)
				save();
		});
		
	}).on("error", (err) => {
		request(page);
	});
}

for(let i = 1; i <= limit; i++){
	request(i);
}
