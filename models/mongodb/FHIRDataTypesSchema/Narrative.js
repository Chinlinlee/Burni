const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    xhtml
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Narrative
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Narrative.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    status: {
        type: String,
        enum: ["generated", "extensions", "additional", "empty"],
        default: void 0
    },
    div: {
        type: xhtml,
        required: true,
        default: void 0
    },
    _status: {
        type: new mongoose.Schema({
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
        }),
        default: void 0
    }
});
module.exports.Narrative = Narrative;