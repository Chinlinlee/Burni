const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    EpisodeOfCare_StatusHistory
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EpisodeOfCare_StatusHistory.add({
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
        enum: ["planned", "waitlist", "active", "onhold", "finished", "cancelled", "entered-in-error"],
        default: void 0
    },
    period: {
        type: Period,
        required: true,
        default: void 0
    }
});
module.exports.EpisodeOfCare_StatusHistory = EpisodeOfCare_StatusHistory;