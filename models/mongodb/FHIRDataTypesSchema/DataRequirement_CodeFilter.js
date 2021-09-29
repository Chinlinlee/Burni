const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const canonical = require('./canonical');
const Coding = require('./Coding');
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
    searchParam: string,
    valueSet: canonical,
    code: {
        type: [Coding],
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});