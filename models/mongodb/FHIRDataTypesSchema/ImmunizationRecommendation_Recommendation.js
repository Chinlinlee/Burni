const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImmunizationRecommendation_DateCriterion
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ImmunizationRecommendation_Recommendation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImmunizationRecommendation_Recommendation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    vaccineCode: {
        type: [CodeableConcept],
        default: void 0
    },
    targetDisease: {
        type: CodeableConcept,
        default: void 0
    },
    contraindicatedVaccineCode: {
        type: [CodeableConcept],
        default: void 0
    },
    forecastStatus: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    forecastReason: {
        type: [CodeableConcept],
        default: void 0
    },
    dateCriterion: {
        type: [ImmunizationRecommendation_DateCriterion],
        default: void 0
    },
    description: string,
    series: string,
    doseNumberPositiveInt: {
        type: Number,
        default: void 0
    },
    doseNumberString: string,
    seriesDosesPositiveInt: {
        type: Number,
        default: void 0
    },
    seriesDosesString: string,
    supportingImmunization: {
        type: [Reference],
        default: void 0
    },
    supportingPatientInformation: {
        type: [Reference],
        default: void 0
    }
});
module.exports.ImmunizationRecommendation_Recommendation =
    ImmunizationRecommendation_Recommendation;
