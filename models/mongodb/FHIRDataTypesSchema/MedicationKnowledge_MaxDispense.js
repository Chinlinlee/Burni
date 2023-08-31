const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicationKnowledge_MaxDispense
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_MaxDispense.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    quantity: {
        type: Quantity,
        required: true,
        default: void 0
    },
    period: {
        type: Duration,
        default: void 0
    }
});
module.exports.MedicationKnowledge_MaxDispense =
    MedicationKnowledge_MaxDispense;
