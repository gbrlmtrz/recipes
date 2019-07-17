const transformer = require('./_transformer');
const objectCopy  = require("fast-copy").default;

const { langs, plateType, mealType, units } = require('./_enum');

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
	diets : {
		type : "array",
		_$searchable : true,
		items : {
			type : "string",
			_$filter: "objectid"
		}
	},
	utensils : {
		type : "array",
		_$searchable : true,
		_$insertable : true,
		_$updateable : true,
		items : {
			type : "string",
			_$filter: "objectid"
		}
	},
	cousine: {
		type: "string",
		_$filter: "objectid",
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	ingredients : {
		type : "array",
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$insertRequired: "ingredientsRequired",
		items : {
			type : "object",
			required :  ["ingredient", "quantity"],
			properties : {
				quantity : {
					type : "number",
					_$insertable : true,
					_$updateable : true,
					_$insertRequired: "quantityRequired"
				},
				ingredient : {
					type : "string",
					_$filter: "objectid",
					_$insertable : true,
					_$updateable : true,
					_$insertRequired: "ingredientRequired"
				}
			}
		}
	},
	upc : {
		type : "string",
		minLength : 10,
		maxLength : 14,
		_$index : 1,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	gtin : {
		type : "string",
		minLength : 8,
		maxLength : 14,
		_$index : 1,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true
	},
	time : {
		type : "number",
		_$index : 1,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$insertRequired: "timeRequired"
	},
	portions : {
		type : "number",
		_$index : 1,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$insertRequired: "portionsRequired"
	},
	totalCal : {
		type : "number",
		_$searchable : true
	},
	totalFat : {
		type : "number",
		_$searchable : true
	},
	totalSaturateFat : {
		type : "number",
		_$searchable : true
	},
	totalCholesterol : {
		type : "number",
		_$searchable : true
	},
	totalSodium : {
		type : "number",
		_$searchable : true
	},
	totalCarbohydrate : {
		type : "number",
		_$searchable : true
	},
	totalDietaryFiber : {
		type : "number",
		_$searchable : true
	},
	totalSugars : {
		type : "number",
		_$searchable : true
	},
	totalProtein : {
		type : "number",
		_$searchable : true
	},
	totalPotassium : {
		type : "number",
		_$searchable : true
	},
	plateType : {
		type : "string",
		_$index : 1,
		enum : plateType,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$insertRequired: "plateTypeRequired"
	},
	mealType : {
		type : "string",
		enum : mealType,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$insertRequired: "mealTypeRequired"
	},
	level : {
		type : "number",
		_$index : 1,
		_$insertable : true,
		_$updateable : true,
		_$searchable : true,
		_$insertRequired: "levelRequired"
	},
	friendlyID : {
		type : "string",
		_$index : 1,
		_$unique : true,
		_$searchable : true
	},
	translations : {
		type : "array",
		_$insertable : true,
		_$updateable : true,
		_$insertRequired: "recipeRequired",
		items : {
			type : "object",
			required : ["name", "language", "recipe"],
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
				},
				recipe : {
					type : "string",
					_$insertable : true,
					_$updateable : true,
					_$insertRequired: "recipeRequired"
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