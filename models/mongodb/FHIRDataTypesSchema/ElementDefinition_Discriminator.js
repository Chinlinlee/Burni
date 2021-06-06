const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
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
        type: String,
        enum: ["value", "exists", "pattern", "type", "profile"],
        default: void 0
    },
    path: string
}, {
    _id: false
});