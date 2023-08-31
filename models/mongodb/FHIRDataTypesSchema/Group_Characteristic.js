const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Group_Characteristic
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Group_Characteristic.add({
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
        required: true,
        default: void 0
    },
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueBoolean: boolean,
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueRange: {
        type: Range,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    },
    exclude: boolean,
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.Group_Characteristic = Group_Characteristic;
