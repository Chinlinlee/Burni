const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    EffectEvidenceSynthesis_CertaintySubcomponent
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    EffectEvidenceSynthesis_Certainty
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EffectEvidenceSynthesis_Certainty.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    rating: {
        type: [CodeableConcept],
        default: void 0
    },
    note: {
        type: [Annotation],
        default: void 0
    },
    certaintySubcomponent: {
        type: [EffectEvidenceSynthesis_CertaintySubcomponent],
        default: void 0
    }
});
module.exports.EffectEvidenceSynthesis_Certainty = EffectEvidenceSynthesis_Certainty;