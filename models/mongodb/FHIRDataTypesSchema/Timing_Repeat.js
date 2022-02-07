const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const decimal = require('../FHIRDataTypesSchema/decimal');
const code = require('../FHIRDataTypesSchema/code');
const time = require('../FHIRDataTypesSchema/time');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');

const {
    Timing_Repeat
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Timing_Repeat.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    boundsDuration: {
        type: Duration,
        default: void 0
    },
    boundsRange: {
        type: Range,
        default: void 0
    },
    boundsPeriod: {
        type: Period,
        default: void 0
    },
    count: positiveInt,
    countMax: positiveInt,
    duration: decimal,
    durationMax: decimal,
    durationUnit: {
        type: String,
        enum: ["s", "min", "h", "d", "wk", "mo", "a"],
        default: void 0
    },
    frequency: positiveInt,
    frequencyMax: positiveInt,
    period: decimal,
    periodMax: decimal,
    periodUnit: {
        type: String,
        enum: ["s", "min", "h", "d", "wk", "mo", "a"],
        default: void 0
    },
    dayOfWeek: {
        type: [code],
        default: void 0
    },
    timeOfDay: {
        type: [time],
        default: void 0
    },
    when: {
        type: [String],
        default: void 0
    },
    offset: unsignedInt
});
module.exports.Timing_Repeat = Timing_Repeat;