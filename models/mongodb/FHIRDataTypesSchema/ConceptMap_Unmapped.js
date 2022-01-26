const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const string = require('../FHIRDataTypesSchema/string');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    ConceptMap_Unmapped
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ConceptMap_Unmapped.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    mode: {
        type: String,
        enum: ["provided", "fixed", "other-map"],
        default: void 0
    },
    code: code,
    display: string,
    url: canonical
});
module.exports.ConceptMap_Unmapped = ConceptMap_Unmapped;