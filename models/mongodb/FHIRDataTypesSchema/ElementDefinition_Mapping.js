const mongoose = require('mongoose');
const Extension = require('./Extension');
const id = require('./id');
const code = require('./code');
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
    identity: id,
    language: code,
    map: string,
    comment: string
}, {
    _id: false
});