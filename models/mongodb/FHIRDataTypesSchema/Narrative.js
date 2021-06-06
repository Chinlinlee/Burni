const mongoose = require('mongoose');
const Extension = require('./Extension');
const xhtml = require('./xhtml');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    status: {
        type: String,
        enum: ["generated", "extensions", "additional", "empty"],
        default: void 0
    },
    div: xhtml
}, {
    _id: false
});