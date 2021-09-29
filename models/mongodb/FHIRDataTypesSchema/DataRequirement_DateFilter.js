const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const Period = require('./Period');
const Duration = require('./Duration');
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
    valueDateTime: string,
    valuePeriod: {
        type: Period,
        default: void 0
    },
    valueDuration: {
        type: Duration,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});