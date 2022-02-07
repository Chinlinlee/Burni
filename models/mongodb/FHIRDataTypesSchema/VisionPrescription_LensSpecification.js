const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    VisionPrescription_Prism
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    VisionPrescription_LensSpecification
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
VisionPrescription_LensSpecification.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    product: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    eye: {
        type: String,
        enum: ["right", "left"],
        default: void 0
    },
    sphere: decimal,
    cylinder: decimal,
    axis: integer,
    prism: {
        type: [VisionPrescription_Prism],
        default: void 0
    },
    add: decimal,
    power: decimal,
    backCurve: decimal,
    diameter: decimal,
    duration: {
        type: Quantity,
        default: void 0
    },
    color: string,
    brand: string,
    note: {
        type: [Annotation],
        default: void 0
    }
});
module.exports.VisionPrescription_LensSpecification = VisionPrescription_LensSpecification;