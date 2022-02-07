const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');

const {
    ValueSet_Filter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Filter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    property: code,
    op: {
        type: String,
        enum: ["=", "is-a", "descendent-of", "is-not-a", "regex", "in", "not-in", "generalizes", "exists"],
        default: void 0
    },
    value: string
});
module.exports.ValueSet_Filter = ValueSet_Filter;