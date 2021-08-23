const mongoose = require('mongoose');
const Extension = require('./Extension');
const Duration = require('./Duration');
const Range = require('./Range');
const Period = require('./Period');
const positiveInt = require('./positiveInt');
const decimal = require('./decimal');
const code = require('./code');
const time = require('./time');
const unsignedInt = require('./unsignedInt');
module.exports = new mongoose.Schema({
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
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});