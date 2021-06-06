const mongoose = require('mongoose');
const Extension = require('./Extension');
const CodeableConcept = require('./CodeableConcept');
const Range = require('./Range');
const Quantity = require('./Quantity');
const Ratio = require('./Ratio');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    doseRange: {
        type: Range,
        default: void 0
    },
    doseQuantity: {
        type: Quantity,
        default: void 0
    },
    rateRatio: {
        type: Ratio,
        default: void 0
    },
    rateRange: {
        type: Range,
        default: void 0
    },
    rateQuantity: {
        type: Quantity,
        default: void 0
    }
}, {
    _id: false
});