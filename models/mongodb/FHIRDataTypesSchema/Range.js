const mongoose = require('mongoose');
const Extension = require('./Extension');
const Quantity = require('./Quantity');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    low: {
        type: Quantity,
        default: void 0
    },
    high: {
        type: Quantity,
        default: void 0
    }
}, {
    _id: false
});