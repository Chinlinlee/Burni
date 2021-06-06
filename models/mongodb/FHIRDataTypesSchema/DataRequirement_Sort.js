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
    path: string,
    direction: {
        type: String,
        enum: ["ascending", "descending"],
        default: void 0
    }
}, {
    _id: false
});