const mongoose = require('mongoose');
const Extension = require('./Extension');
const code = require('./code');
const base64Binary = require('./base64Binary');
const url = require('./url');
const unsignedInt = require('./unsignedInt');
const string = require('./string');
const dateTime = require('./dateTime');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    contentType: code,
    language: code,
    data: base64Binary,
    url: url,
    size: unsignedInt,
    hash: base64Binary,
    title: string,
    creation: dateTime
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});