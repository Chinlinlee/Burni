const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TestScript_Link
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TestScript_Capability
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestScript_Metadata
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Metadata.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    link: {
        type: [TestScript_Link],
        default: void 0
    },
    capability: {
        type: [TestScript_Capability],
        required: true,
        default: void 0
    }
});
module.exports.TestScript_Metadata = TestScript_Metadata;