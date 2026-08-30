const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ClinicalImpression_Investigation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClinicalImpression_Investigation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    item: {
        type: [Reference],
        default: void 0
    }
});
module.exports.ClinicalImpression_Investigation = ClinicalImpression_Investigation;