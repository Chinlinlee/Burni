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
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    DeviceRequest_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DeviceRequest_Parameter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueRange: {
        type: Range,
        default: void 0
    },
    valueBoolean: boolean
});
module.exports.DeviceRequest_Parameter = DeviceRequest_Parameter;