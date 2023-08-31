const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");
const {
    ValueSet_Designation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ValueSet_Concept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Concept.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    display: string,
    designation: {
        type: [ValueSet_Designation],
        default: void 0
    }
});
module.exports.ValueSet_Concept = ValueSet_Concept;
