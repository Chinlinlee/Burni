const mongoose = require('mongoose');
const Extension = require('./Extension');
const Quantity = require('./Quantity');
const string = require('./string');
const Attachment = require('./Attachment');
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
    height: {
        type: Quantity,
        default: void 0
    },
    width: {
        type: Quantity,
        default: void 0
    },
    depth: {
        type: Quantity,
        default: void 0
    },
    weight: {
        type: Quantity,
        default: void 0
    },
    nominalVolume: {
        type: Quantity,
        default: void 0
    },
    externalDiameter: {
        type: Quantity,
        default: void 0
    },
    shape: string,
    color: {
        type: [string],
        default: void 0
    },
    imprint: {
        type: [string],
        default: void 0
    },
    image: {
        type: [Attachment],
        default: void 0
    },
    scoring: {
        type: CodeableConcept,
        default: void 0
    }
}, {
    _id: false
});