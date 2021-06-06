const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const id = require('./id');
const uri = require('./uri');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    name: id,
    language: {
        type: String,
        enum: ["text/cql", "text/fhirpath", "application/x-fhir-query"],
        default: void 0
    },
    expression: string,
    reference: uri
}, {
    _id: false
});