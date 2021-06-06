const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const Timing = require('./Timing');
const Reference = require('./Reference');
const DataRequirement = require('./DataRequirement');
const Expression = require('./Expression');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["named-event", "periodic", "data-changed", "data-added", "data-modified", "data-removed", "data-accessed", "data-access-ended"],
        default: void 0
    },
    name: string,
    timingTiming: {
        type: Timing,
        default: void 0
    },
    timingReference: {
        type: Reference,
        default: void 0
    },
    timingDate: string,
    timingDateTime: string,
    data: {
        type: [DataRequirement],
        default: void 0
    },
    condition: {
        type: Expression,
        default: void 0
    }
}, {
    _id: false
});