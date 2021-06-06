const mongoose = require('mongoose');
const Extension = require('./Extension');
const dateTime = require('./dateTime');
const Timing_Repeat = require('./Timing_Repeat');
const CodeableConcept = require('./CodeableConcept');
module.exports = new mongoose.Schema({
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
}, {
    _id: false
});