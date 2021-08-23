const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const positiveInt = require('./positiveInt');
const Period = require('./Period');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    system: {
        type: String,
        enum: ["phone", "fax", "email", "pager", "url", "sms", "other"],
        default: void 0
    },
    value: string,
    use: {
        type: String,
        enum: ["home", "work", "temp", "old", "mobile"],
        default: void 0
    },
    rank: positiveInt,
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