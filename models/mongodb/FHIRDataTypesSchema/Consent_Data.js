const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Consent_Data
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Consent_Data.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    meaning: {
        type: String,
        enum: ["instance", "related", "dependents", "authoredby"],
        default: void 0
    },
    reference: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.Consent_Data = Consent_Data;