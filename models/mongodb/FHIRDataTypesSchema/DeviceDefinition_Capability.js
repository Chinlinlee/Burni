const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    DeviceDefinition_Capability
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DeviceDefinition_Capability.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    description: {
        type: [CodeableConcept],
        default: void 0
    }
});
module.exports.DeviceDefinition_Capability = DeviceDefinition_Capability;