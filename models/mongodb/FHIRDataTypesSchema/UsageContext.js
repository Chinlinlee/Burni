const mongoose = require('mongoose');
const Extension = require('./Extension');
const Coding = require('./Coding');
const CodeableConcept = require('./CodeableConcept');
const Quantity = require('./Quantity');
const Range = require('./Range');
const Reference = require('./Reference');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: Coding,
        required: true,
        default: void 0
    },
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueRange: {
        type: Range,
        default: void 0
    },
    valueReference: {
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