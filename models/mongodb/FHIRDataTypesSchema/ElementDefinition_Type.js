const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    ElementDefinition_Type
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition_Type.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: uri,
    profile: {
        type: [canonical],
        default: void 0
    },
    targetProfile: {
        type: [canonical],
        default: void 0
    },
    aggregation: {
        type: [String],
        default: void 0
    },
    versioning: {
        type: String,
        enum: ["either", "independent", "specific"],
        default: void 0
    }
});
module.exports.ElementDefinition_Type = ElementDefinition_Type;