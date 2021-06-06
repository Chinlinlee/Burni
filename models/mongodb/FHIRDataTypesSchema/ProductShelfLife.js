const mongoose = require('mongoose');
const Extension = require('./Extension');
const Identifier = require('./Identifier');
const CodeableConcept = require('./CodeableConcept');
const Quantity = require('./Quantity');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    period: {
        type: Quantity,
        required: true,
        default: void 0
    },
    specialPrecautionsForStorage: {
        type: [CodeableConcept],
        default: void 0
    }
}, {
    _id: false
});