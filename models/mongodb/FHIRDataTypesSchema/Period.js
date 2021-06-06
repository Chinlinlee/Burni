const mongoose = require('mongoose');
const Extension = require('./Extension');
const dateTime = require('./dateTime');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    start: dateTime,
    end: dateTime
}, {
    _id: false
});