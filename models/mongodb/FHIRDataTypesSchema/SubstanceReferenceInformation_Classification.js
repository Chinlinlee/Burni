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
    SubstanceReferenceInformation_Classification
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceReferenceInformation_Classification.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    domain: {
        type: CodeableConcept,
        default: void 0
    },
    classification: {
        type: CodeableConcept,
        default: void 0
    },
    subtype: {
        type: [CodeableConcept],
        default: void 0
    },
    source: {
        type: [Reference],
        default: void 0
    }
});
module.exports.SubstanceReferenceInformation_Classification = SubstanceReferenceInformation_Classification;