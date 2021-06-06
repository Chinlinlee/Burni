const mongoose = require('mongoose');
const Extension = require('./Extension');
const ElementDefinition_Discriminator = require('./ElementDefinition_Discriminator');
const string = require('./string');
const boolean = require('./boolean');
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    discriminator: {
        type: [ElementDefinition_Discriminator],
        default: void 0
    },
    description: string,
    ordered: boolean,
    rules: {
        type: String,
        enum: ["closed", "open", "openAtEnd"],
        default: void 0
    }
}, {
    _id: false
});