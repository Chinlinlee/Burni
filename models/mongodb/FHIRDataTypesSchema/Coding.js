const mongoose = require('mongoose');
const Extension = require('./Extension');
const uri = require('./uri');
const string = require('./string');
const code = require('./code');
const boolean = require('./boolean');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    system: uri,
    version: string,
    code: code,
    display: string,
    userSelected: boolean
}, {
    _id: false
});