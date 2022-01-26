const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicationRequest_InitialFill
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationRequest_DispenseRequest
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationRequest_DispenseRequest.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    initialFill: {
        type: MedicationRequest_InitialFill,
        default: void 0
    },
    dispenseInterval: {
        type: Duration,
        default: void 0
    },
    validityPeriod: {
        type: Period,
        default: void 0
    },
    numberOfRepeatsAllowed: unsignedInt,
    quantity: {
        type: Quantity,
        default: void 0
    },
    expectedSupplyDuration: {
        type: Duration,
        default: void 0
    },
    performer: {
        type: Reference,
        default: void 0
    }
});
module.exports.MedicationRequest_DispenseRequest = MedicationRequest_DispenseRequest;