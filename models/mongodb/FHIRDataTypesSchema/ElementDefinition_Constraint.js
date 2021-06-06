const mongoose = require('mongoose');
const Extension = require('./Extension');
const id = require('./id');
const string = require('./string');
const canonical = require('./canonical');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    key: id,
    requirements: string,
    severity: {
        type: String,
        enum: ["error", "warning"],
        default: void 0
    },
    human: string,
    expression: string,
    xpath: string,
    source: canonical
}, {
    _id: false
});