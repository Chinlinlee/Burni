const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const Period = require('./Period');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    use: {
        type: String,
        enum: ["usual", "official", "temp", "nickname", "anonymous", "old", "maiden"],
        default: void 0
    },
    text: string,
    family: string,
    given: {
        type: [string],
        default: void 0
    },
    prefix: {
        type: [string],
        default: void 0
    },
    suffix: {
        type: [string],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});