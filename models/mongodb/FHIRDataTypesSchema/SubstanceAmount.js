const mongoose = require('mongoose');
const Extension = require('./Extension');
const Quantity = require('./Quantity');
const Range = require('./Range');
const string = require('./string');
const CodeableConcept = require('./CodeableConcept');
const SubstanceAmount_ReferenceRange = require('./SubstanceAmount_ReferenceRange');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    amountQuantity: {
        type: Quantity,
        default: void 0
    },
    amountRange: {
        type: Range,
        default: void 0
    },
    amountString: string,
    amountType: {
        type: CodeableConcept,
        default: void 0
    },
    amountText: string,
    referenceRange: {
        type: SubstanceAmount_ReferenceRange,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});