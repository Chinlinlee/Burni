const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const uri = require('./uri');
const Identifier = require('./Identifier');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    reference: string,
    type: uri,
    identifier: {
        type: Identifier,
        default: void 0
    },
    display: string
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});