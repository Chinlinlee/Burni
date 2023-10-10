const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    EffectEvidenceSynthesis_ResultsByExposure
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EffectEvidenceSynthesis_ResultsByExposure.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    exposureState: {
        type: String,
        enum: ["exposure", "exposure-alternative"],
        default: void 0
    },
    variantState: {
        type: CodeableConcept,
        default: void 0
    },
    riskEvidenceSynthesis: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.EffectEvidenceSynthesis_ResultsByExposure =
    EffectEvidenceSynthesis_ResultsByExposure;
