const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const date = require("../FHIRDataTypesSchema/date");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Address } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExplanationOfBenefit_Accident
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Accident.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    date: date,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    locationAddress: {
        type: Address,
        default: void 0
    },
    locationReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Accident = ExplanationOfBenefit_Accident;
