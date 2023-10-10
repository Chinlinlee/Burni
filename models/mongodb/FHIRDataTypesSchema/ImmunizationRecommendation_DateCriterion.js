const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");

const {
    ImmunizationRecommendation_DateCriterion
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImmunizationRecommendation_DateCriterion.add({
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
    value: dateTime
});
module.exports.ImmunizationRecommendation_DateCriterion =
    ImmunizationRecommendation_DateCriterion;
