const mongoose = require('mongoose');
const Extension = require('./Extension');
const Reference = require('./Reference');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    other: {
        type: Reference,
        required: true,
        default: void 0
    },
    type: {
        type: String,
        enum: ["replaced-by", "replaces", "refer", "seealso"],
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});