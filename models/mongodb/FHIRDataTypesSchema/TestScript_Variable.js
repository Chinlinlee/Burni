const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const id = require("../FHIRDataTypesSchema/id");

const {
    TestScript_Variable
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Variable.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    defaultValue: string,
    description: string,
    expression: string,
    headerField: string,
    hint: string,
    path: string,
    sourceId: id
});
module.exports.TestScript_Variable = TestScript_Variable;
