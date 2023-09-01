const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const uri = require("../FHIRDataTypesSchema/uri");
const boolean = require("../FHIRDataTypesSchema/boolean");
const string = require("../FHIRDataTypesSchema/string");
const code = require("../FHIRDataTypesSchema/code");
const {
    ValueSet_Designation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ValueSet_Contains
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Contains.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    system: uri,
    abstract: boolean,
    inactive: boolean,
    version: string,
    code: code,
    display: string,
    designation: {
        type: [ValueSet_Designation],
        default: void 0
    },
    contains: {
        type: [this],
        default: void 0
    }
});
module.exports.ValueSet_Contains = ValueSet_Contains;
