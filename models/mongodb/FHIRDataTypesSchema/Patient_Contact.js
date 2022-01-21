const mongoose = require('mongoose');
const Extension = require('./Extension');
const CodeableConcept = require('./CodeableConcept');
const HumanName = require('./HumanName');
const ContactPoint = require('./ContactPoint');
const Address = require('./Address');
const Reference = require('./Reference');
const Period = require('./Period');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    relationship: {
        type: [CodeableConcept],
        default: void 0
    },
    name: {
        type: HumanName,
        default: void 0
    },
    telecom: {
        type: [ContactPoint],
        default: void 0
    },
    address: {
        type: Address,
        default: void 0
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", "unknown"],
        default: void 0
    },
    organization: {
        type: Reference,
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});