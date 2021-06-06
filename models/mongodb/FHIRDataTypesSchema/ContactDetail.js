const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const ContactPoint = require('./ContactPoint');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    telecom: {
        type: [ContactPoint],
        default: void 0
    }
}, {
    _id: false
});