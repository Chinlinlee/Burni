const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExplanationOfBenefit_Procedure
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Procedure.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    type: {
        type: [CodeableConcept],
        default: void 0
    },
    date: dateTime,
    procedureCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    procedureReference: {
        type: Reference,
        default: void 0
    },
    udi: {
        type: [Reference],
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Procedure = ExplanationOfBenefit_Procedure;
