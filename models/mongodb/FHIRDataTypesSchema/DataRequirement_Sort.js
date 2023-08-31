const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    DataRequirement_Sort
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DataRequirement_Sort.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    direction: {
        type: String,
        enum: ["ascending", "descending"],
        default: void 0
    }
});
module.exports.DataRequirement_Sort = DataRequirement_Sort;
