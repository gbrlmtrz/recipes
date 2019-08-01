const transformer = require('./_transformer');
const objectCopy  = require("fast-copy");
const { langs, ingredientType } = require('./_enum');

const EntitySchema = {
	_id: {
		type: "string",
		_$filter: "objectid",
		_$label: "id",
		_$displayAs: "text"
	},
	$text : {
		type : "string",
		_$filter : "textIndex",
		_$private : true,
		_$searchable : true
	},
	nf : {
		type : "object",
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		default: {},
		_$insertRequired : "nfRequired",
		/*required : [
			"minCal", 
			"maxCal", 
			"minFat", 
			"maxFat", 
			"minSaturatedFat", 
			"maxSaturatedFat", 
			"minCholesterol",
			"maxCholesterol",
			"minSodium",
			"maxSodium",
			"minCarbohydrate",
			"maxCarbohydrate",
			"minDietaryFiber",
			"maxDietaryFiber",
			"minSugars",
			"maxSugars",
			"minProtein",
			"maxProtein",
			"minPotassium",
			"maxPotassium"
		],*/
		properties : {
			
			minCal: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxCal: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minFat: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxFat: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minSaturatedFat: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxSaturatedFat: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minCholesterol: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxCholesterol: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minSodium: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxSodium: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minCarbohydrate: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxCarbohydrate: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minDietaryFiber: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxDietaryFiber: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minSugars: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxSugars: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minProtein: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxProtein: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			minPotassium: {
				type : "number",
				default: 0,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			},
			maxPotassium: {
				type : "number",
				default: 99999,
				_$insertable : true,
				_$updateable : true,
				_$searchable : true
			}
	
		}
	},
	
	minTime : {
		type : "number",
		default: 0,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	maxTime : {
		type : "number",
		default: 9999,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	requiredUtensil : {
		type : "array",
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		default: [],
		items : {
			type: "string",
			_$filter: "objectid",
		}
	},
	withoutUtensil : {
		type : "array",
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		default: [],
		items : {
			type: "string",
			_$filter: "objectid",
		}
	},
	maxUtensils : {
		type : "number",
		default: 999999,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	minUtensils : {
		type : "number",
		default: 0,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	maxIngredients : {
		type : "number",
		default: 999999,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	minIngredients : {
		type : "number",
		default: 0,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	requiredIngredientType : {
		type : "array",
		default: [],
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		items : {
			type : "string",
			enum : ingredientType
		}
	},
	withoutIngredientType : {
		type : "array",
		default: [],
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		items : {
			type : "string",
			enum : ingredientType
		}
	},
	requiredIngredient : {
		type : "array",
		default: [],
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		items : {
			type: "string",
			_$filter: "objectid",
		}
	},
	withoutIngredient : {
		type : "array",
		default: [],
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		items : {
			type: "string",
			_$filter: "objectid",
		}
	},
	translations : {
		type : "array",
		_$insertable : true,
		_$updateable : true,
		items : {
			type : "object",
			required : ["name", "language"],
			properties: {
				language : {
					type : "string",
					enum : langs,
					language: "spanish",
					_$insertable : true,
					_$updateable : true,
					_$insertRequired: "languageRequired"
				},
				name : {
					_$updateable : true,
					_$insertRequired: "nameRequired",
					type : "string",
					_$insertable : true,
				}
			}
		}
	}

};

const InsertSchema = transformer.create(objectCopy(EntitySchema));
const UpdateSchema = transformer.update(objectCopy(EntitySchema));
const RemoveSchema = transformer.remove(objectCopy(EntitySchema));
const GetSchema = transformer.get(objectCopy(EntitySchema));
const RetrieveSchema = transformer.retrieve(objectCopy(EntitySchema));

const routes = [
	{
		url: "/search",
		method: "GET",
		schema: objectCopy(RetrieveSchema),
		entityFuntion: "MakeSearch",
		privs: [
		]
	},
	{
		url: "/id/:id",
		method: "GET",
		schema: objectCopy(GetSchema),
		entityFuntion: "MakeSelectOne",
		privs: [
		
		]
	},
	{
		url: "/id/:id",
		method: "PUT",
		schema: objectCopy(UpdateSchema),
		entityFuntion: "MakeUpdateOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/id/:id",
		method: "DELETE",
		schema: objectCopy(RemoveSchema),
		entityFuntion: "MakeRemoveOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	},
	{
		url: "/",
		method: "POST",
		schema: objectCopy(InsertSchema),
		entityFuntion: "MakeInsertOne",
		privs: [
			{
				method: "isAdmin",
				messageKey: "youMustBeAdmin"
			}
		]
	}
];

module.exports = {
	routes,
	EntitySchema : objectCopy(EntitySchema)
};