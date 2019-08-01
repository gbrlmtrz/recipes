const transformer = require('./_transformer');
const objectCopy  = require("fast-copy");
const { langs } = require('./_enum');

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