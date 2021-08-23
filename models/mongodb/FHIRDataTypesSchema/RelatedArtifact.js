const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const markdown = require('./markdown');
const url = require('./url');
const Attachment = require('./Attachment');
const canonical = require('./canonical');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["documentation", "justification", "citation", "predecessor", "successor", "derived-from", "depends-on", "composed-of"],
        default: void 0
    },
    label: string,
    display: string,
    citation: markdown,
    url: url,
    document: {
        type: Attachment,
        default: void 0
    },
    resource: canonical
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});