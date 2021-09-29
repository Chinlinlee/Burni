const mongoose = require('mongoose');
const Extension = require('./Extension');
const Range = require('./Range');
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
    ageRange: {
        type: Range,
        default: void 0
    },
    ageCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    gender: {
        type: CodeableConcept,
        default: void 0
    },
    race: {
        type: CodeableConcept,
        default: void 0
    },
    physiologicalCondition: {
        type: CodeableConcept,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});