const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationRequest_InitialFill
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationRequest_InitialFill.add({
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
        default: void 0
    },
    duration: {
        type: Duration,
        default: void 0
    }
});
module.exports.MedicationRequest_InitialFill = MedicationRequest_InitialFill;