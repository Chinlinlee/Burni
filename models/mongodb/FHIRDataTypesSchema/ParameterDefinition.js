const mongoose = require('mongoose');
const Extension = require('./Extension');
const code = require('./code');
const integer = require('./integer');
const string = require('./string');
const canonical = require('./canonical');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    name: code,
    use: code,
    min: integer,
    max: string,
    documentation: string,
    type: code,
    profile: canonical
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});