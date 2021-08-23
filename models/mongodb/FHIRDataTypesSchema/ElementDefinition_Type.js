const mongoose = require('mongoose');
const Extension = require('./Extension');
const uri = require('./uri');
const canonical = require('./canonical');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: uri,
    profile: {
        type: [canonical],
        default: void 0
    },
    targetProfile: {
        type: [canonical],
        default: void 0
    },
    aggregation: {
        type: [String],
        default: void 0
    },
    versioning: {
        type: String,
        enum: ["either", "independent", "specific"],
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});