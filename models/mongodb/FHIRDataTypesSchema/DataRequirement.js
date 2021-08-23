const mongoose = require('mongoose');
const Extension = require('./Extension');
const code = require('./code');
const canonical = require('./canonical');
const CodeableConcept = require('./CodeableConcept');
const Reference = require('./Reference');
const string = require('./string');
const DataRequirement_CodeFilter = require('./DataRequirement_CodeFilter');
const DataRequirement_DateFilter = require('./DataRequirement_DateFilter');
const positiveInt = require('./positiveInt');
const DataRequirement_Sort = require('./DataRequirement_Sort');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: code,
    profile: {
        type: [canonical],
        default: void 0
    },
    subjectCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    subjectReference: {
        type: Reference,
        default: void 0
    },
    mustSupport: {
        type: [string],
        default: void 0
    },
    codeFilter: {
        type: [DataRequirement_CodeFilter],
        default: void 0
    },
    dateFilter: {
        type: [DataRequirement_DateFilter],
        default: void 0
    },
    limit: positiveInt,
    sort: {
        type: [DataRequirement_Sort],
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});