const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Encounter_ClassHistory
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Encounter_ClassHistory.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    class: {
        type: Coding,
        required: true,
        default: void 0
    },
    period: {
        type: Period,
        required: true,
        default: void 0
    }
});
module.exports.Encounter_ClassHistory = Encounter_ClassHistory;
