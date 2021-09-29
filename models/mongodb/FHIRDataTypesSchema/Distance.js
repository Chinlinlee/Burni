const mongoose = require('mongoose');
const Extension = require('./Extension');
const decimal = require('./decimal');
const string = require('./string');
const uri = require('./uri');
const code = require('./code');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    value: decimal,
    comparator: {
        type: String,
        enum: ["<", "<=", ">=", ">"],
        default: void 0
    },
    unit: string,
    system: uri,
    code: code
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});