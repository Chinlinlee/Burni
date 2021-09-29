const mongoose = require('mongoose');
const Extension = require('./Extension');
const integer = require('./integer');
const string = require('./string');
const CodeableConcept = require('./CodeableConcept');
const Timing = require('./Timing');
const boolean = require('./boolean');
const Dosage_DoseAndRate = require('./Dosage_DoseAndRate');
const Ratio = require('./Ratio');
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
    sequence: integer,
    text: string,
    additionalInstruction: {
        type: [CodeableConcept],
        default: void 0
    },
    patientInstruction: string,
    timing: {
        type: Timing,
        default: void 0
    },
    asNeededBoolean: boolean,
    asNeededCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    site: {
        type: CodeableConcept,
        default: void 0
    },
    route: {
        type: CodeableConcept,
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    },
    doseAndRate: {
        type: [Dosage_DoseAndRate],
        default: void 0
    },
    maxDosePerPeriod: {
        type: Ratio,
        default: void 0
    },
    maxDosePerAdministration: {
        type: Quantity,
        default: void 0
    },
    maxDosePerLifetime: {
        type: Quantity,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});