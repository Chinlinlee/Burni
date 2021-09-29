const mongoose = require('mongoose');
const Extension = require('./Extension');
const Coding = require('./Coding');
const string = require('./string');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    coding: {
        type: [Coding],
        default: void 0
    },
    text: string
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});