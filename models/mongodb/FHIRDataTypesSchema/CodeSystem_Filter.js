const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");

const {
    CodeSystem_Filter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CodeSystem_Filter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    description: string,
    operator: {
        type: [code],
        default: void 0
    },
    value: string
});
module.exports.CodeSystem_Filter = CodeSystem_Filter;
