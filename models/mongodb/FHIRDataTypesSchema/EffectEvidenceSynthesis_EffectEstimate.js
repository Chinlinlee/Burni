const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");
const {
    EffectEvidenceSynthesis_PrecisionEstimate
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    EffectEvidenceSynthesis_EffectEstimate
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EffectEvidenceSynthesis_EffectEstimate.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    variantState: {
        type: CodeableConcept,
        default: void 0
    },
    value: decimal,
    unitOfMeasure: {
        type: CodeableConcept,
        default: void 0
    },
    precisionEstimate: {
        type: [EffectEvidenceSynthesis_PrecisionEstimate],
        default: void 0
    }
});
module.exports.EffectEvidenceSynthesis_EffectEstimate =
    EffectEvidenceSynthesis_EffectEstimate;
