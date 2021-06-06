const mongoose = require('mongoose');
const Extension = require('./Extension');
const Reference = require('./Reference');
const string = require('./string');
const dateTime = require('./dateTime');
const markdown = require('./markdown');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    authorReference: {
        type: Reference,
        default: void 0
    },
    authorString: string,
    time: dateTime,
    text: markdown
}, {
    _id: false
});