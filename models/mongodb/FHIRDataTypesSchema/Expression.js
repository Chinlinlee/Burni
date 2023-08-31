const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const id = require("../FHIRDataTypesSchema/id");
const uri = require("../FHIRDataTypesSchema/uri");

const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Expression.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    name: id,
    language: {
        type: String,
        enum: ["text/cql", "text/fhirpath", "application/x-fhir-query"],
        default: void 0
    },
    expression: string,
    reference: uri
});
module.exports.Expression = Expression;
