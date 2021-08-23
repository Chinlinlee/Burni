const mongoose = require('mongoose');
const Extension = require('./Extension');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});