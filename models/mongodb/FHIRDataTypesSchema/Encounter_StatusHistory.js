const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Encounter_StatusHistory
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Encounter_StatusHistory.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    status: {
        type: String,
        enum: ["planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled", "entered-in-error", "unknown"],
        default: void 0
    },
    period: {
        type: Period,
        required: true,
        default: void 0
    }
});
module.exports.Encounter_StatusHistory = Encounter_StatusHistory;