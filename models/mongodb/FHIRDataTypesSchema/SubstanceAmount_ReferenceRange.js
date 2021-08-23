const mongoose = require('mongoose');
const Extension = require('./Extension');
const Quantity = require('./Quantity');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    lowLimit: {
        type: Quantity,
        default: void 0
    },
    highLimit: {
        type: Quantity,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});