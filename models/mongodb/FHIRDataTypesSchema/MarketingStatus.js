const mongoose = require('mongoose');
const Extension = require('./Extension');
const CodeableConcept = require('./CodeableConcept');
const Period = require('./Period');
const dateTime = require('./dateTime');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    country: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    jurisdiction: {
        type: CodeableConcept,
        default: void 0
    },
    status: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    dateRange: {
        type: Period,
        required: true,
        default: void 0
    },
    restoreDate: dateTime
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});