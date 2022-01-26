const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Timing_Repeat
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Timing
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Timing.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    event: {
        type: [dateTime],
        default: void 0
    },
    repeat: {
        type: Timing_Repeat,
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.Timing = Timing;