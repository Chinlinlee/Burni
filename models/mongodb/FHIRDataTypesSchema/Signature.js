const mongoose = require('mongoose');
const Extension = require('./Extension');
const Coding = require('./Coding');
const instant = require('./instant');
const Reference = require('./Reference');
const code = require('./code');
const base64Binary = require('./base64Binary');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: [Coding],
        required: true,
        default: void 0
    },
    when: instant,
    who: {
        type: Reference,
        required: true,
        default: void 0
    },
    onBehalfOf: {
        type: Reference,
        default: void 0
    },
    targetFormat: code,
    sigFormat: code,
    data: base64Binary
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});