const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Person_Link
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Person_Link.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    target: {
        type: Reference,
        required: true,
        default: void 0
    },
    assurance: {
        type: String,
        enum: ["level1", "level2", "level3", "level4"],
        default: void 0
    }
});
module.exports.Person_Link = Person_Link;
