const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Specimen_Container
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Specimen_Container.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: [Identifier],
        default: void 0
    },
    description: string,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    capacity: {
        type: Quantity,
        default: void 0
    },
    specimenQuantity: {
        type: Quantity,
        default: void 0
    },
    additiveCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    additiveReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.Specimen_Container = Specimen_Container;
