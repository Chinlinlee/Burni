const mongoose = require('mongoose');
const Extension = require('./Extension');
const CodeableConcept = require('./CodeableConcept');
const uri = require('./uri');
const string = require('./string');
const Period = require('./Period');
const Reference = require('./Reference');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    use: {
        type: String,
        enum: ["usual", "official", "temp", "secondary", "old"],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    system: uri,
    value: string,
    period: {
        type: Period,
        default: void 0
    },
    assigner: {
        type: Reference,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});