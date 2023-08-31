const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ClaimResponse_Total
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_Total.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    category: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    amount: {
        type: Money,
        required: true,
        default: void 0
    }
});
module.exports.ClaimResponse_Total = ClaimResponse_Total;
