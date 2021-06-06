const mongoose = require('mongoose');
const Extension = require('./Extension');
const decimal = require('./decimal');
const code = require('./code');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    value: decimal,
    currency: code
}, {
    _id: false
});