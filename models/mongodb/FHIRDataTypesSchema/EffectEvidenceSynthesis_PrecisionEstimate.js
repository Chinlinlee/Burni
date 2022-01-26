const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');

const {
    EffectEvidenceSynthesis_PrecisionEstimate
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EffectEvidenceSynthesis_PrecisionEstimate.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    level: decimal,
    from: decimal,
    to: decimal
});
module.exports.EffectEvidenceSynthesis_PrecisionEstimate = EffectEvidenceSynthesis_PrecisionEstimate;