const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Measure_SupplementalData
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Measure_SupplementalData.add({
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
        default: void 0
    },
    usage: {
        type: [CodeableConcept],
        default: void 0
    },
    description: string,
    criteria: {
        type: Expression,
        required: true,
        default: void 0
    }
});
module.exports.Measure_SupplementalData = Measure_SupplementalData;
