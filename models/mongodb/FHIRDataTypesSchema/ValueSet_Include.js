const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');
const {
    ValueSet_Concept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ValueSet_Filter
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    ValueSet_Include
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Include.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    system: uri,
    version: string,
    concept: {
        type: [ValueSet_Concept],
        default: void 0
    },
    filter: {
        type: [ValueSet_Filter],
        default: void 0
    },
    valueSet: {
        type: [canonical],
        default: void 0
    }
});
module.exports.ValueSet_Include = ValueSet_Include;