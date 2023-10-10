const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const uri = require("../FHIRDataTypesSchema/uri");
const string = require("../FHIRDataTypesSchema/string");

const {
    CodeSystem_Property
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CodeSystem_Property.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    uri: uri,
    description: string,
    type: {
        type: String,
        enum: [
            "code",
            "Coding",
            "string",
            "integer",
            "boolean",
            "dateTime",
            "decimal"
        ],
        default: void 0
    }
});
module.exports.CodeSystem_Property = CodeSystem_Property;
