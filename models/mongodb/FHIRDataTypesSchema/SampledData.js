const mongoose = require('mongoose');
const Extension = require('./Extension');
const Quantity = require('./Quantity');
const decimal = require('./decimal');
const positiveInt = require('./positiveInt');
const string = require('./string');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    origin: {
        type: Quantity,
        required: true,
        default: void 0
    },
    period: decimal,
    factor: decimal,
    lowerLimit: decimal,
    upperLimit: decimal,
    dimensions: positiveInt,
    data: string
}, {
    _id: false
});