const mongoose = require('mongoose');
const Extension = require('./Extension');
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
    strength: {
        type: String,
        enum: ["required", "extensible", "preferred", "example"],
        default: void 0
    },
    description: string,
    valueSet: canonical
}, {
    _id: false
});