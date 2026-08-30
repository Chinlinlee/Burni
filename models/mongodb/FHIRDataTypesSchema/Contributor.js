const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Contributor
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contributor.add({
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
    },
    _type: {
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
    },
    _name: {
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
module.exports.Contributor = Contributor;