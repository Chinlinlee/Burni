const mongoose = require('mongoose');
const Extension = require('./Extension');
const id = require('./id');
const instant = require('./instant');
const uri = require('./uri');
const canonical = require('./canonical');
const Coding = require('./Coding');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    versionId: id,
    lastUpdated: instant,
    source: uri,
    profile: {
        type: [canonical],
        default: void 0
    },
    security: {
        type: [Coding],
        default: void 0
    },
    tag: {
        type: [Coding],
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});