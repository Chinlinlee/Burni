const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Encounter_Location
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Encounter_Location.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    location: {
        type: Reference,
        required: true,
        default: void 0
    },
    status: {
        type: String,
        enum: ["planned", "active", "reserved", "completed"],
        default: void 0
    },
    physicalType: {
        type: CodeableConcept,
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.Encounter_Location = Encounter_Location;
