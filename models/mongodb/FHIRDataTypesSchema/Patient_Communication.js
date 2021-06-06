const mongoose = require('mongoose');
const Extension = require('./Extension');
const CodeableConcept = require('./CodeableConcept');
const boolean = require('./boolean');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    language: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    preferred: boolean
}, {
    _id: false
});