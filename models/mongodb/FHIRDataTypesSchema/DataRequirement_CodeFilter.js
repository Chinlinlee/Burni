const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const canonical = require("../FHIRDataTypesSchema/canonical");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    DataRequirement_CodeFilter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DataRequirement_CodeFilter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    searchParam: string,
    valueSet: canonical,
    code: {
        type: [Coding],
        default: void 0
    }
});
module.exports.DataRequirement_CodeFilter = DataRequirement_CodeFilter;
