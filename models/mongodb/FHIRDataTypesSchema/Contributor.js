const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const ContactDetail = require('./ContactDetail');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["author", "editor", "reviewer", "endorser"],
        default: void 0
    },
    name: string,
    contact: {
        type: [ContactDetail],
        default: void 0
    }
}, {
    _id: false
});