const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const integer = require("../FHIRDataTypesSchema/integer");
const string = require("../FHIRDataTypesSchema/string");
const canonical = require("../FHIRDataTypesSchema/canonical");
const {
    OperationDefinition_Binding
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    OperationDefinition_ReferencedFrom
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    OperationDefinition_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
OperationDefinition_Parameter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: code,
    use: {
        type: String,
        enum: ["in", "out"],
        default: void 0
    },
    min: integer,
    max: string,
    documentation: string,
    type: code,
    targetProfile: {
        type: [canonical],
        default: void 0
    },
    searchType: {
        type: String,
        enum: [
            "number",
            "date",
            "string",
            "token",
            "reference",
            "composite",
            "quantity",
            "uri",
            "special"
        ],
        default: void 0
    },
    binding: {
        type: OperationDefinition_Binding,
        default: void 0
    },
    referencedFrom: {
        type: [OperationDefinition_ReferencedFrom],
        default: void 0
    },
    part: {
        type: [this],
        default: void 0
    }
});
module.exports.OperationDefinition_Parameter = OperationDefinition_Parameter;
