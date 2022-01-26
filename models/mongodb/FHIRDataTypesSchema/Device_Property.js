const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Device_Property
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Device_Property.add({
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
    valueQuantity: {
        type: [Quantity],
        default: void 0
    },
    valueCode: {
        type: [CodeableConcept],
        default: void 0
    }
});
module.exports.Device_Property = Device_Property;