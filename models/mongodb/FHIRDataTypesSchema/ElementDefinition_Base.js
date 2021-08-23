const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const unsignedInt = require('./unsignedInt');
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
    min: unsignedInt,
    max: string
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});