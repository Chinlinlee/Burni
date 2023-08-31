const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
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
    ProdCharacteristic
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ProductShelfLife
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProductPackaged_PackageItem
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductPackaged_PackageItem.add({
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
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    quantity: {
        type: Quantity,
        required: true,
        default: void 0
    },
    material: {
        type: [CodeableConcept],
        default: void 0
    },
    alternateMaterial: {
        type: [CodeableConcept],
        default: void 0
    },
    device: {
        type: [Reference],
        default: void 0
    },
    manufacturedItem: {
        type: [Reference],
        default: void 0
    },
    packageItem: {
        type: [this],
        default: void 0
    },
    physicalCharacteristics: {
        type: ProdCharacteristic,
        default: void 0
    },
    otherCharacteristics: {
        type: [CodeableConcept],
        default: void 0
    },
    shelfLifeStorage: {
        type: [ProductShelfLife],
        default: void 0
    },
    manufacturer: {
        type: [Reference],
        default: void 0
    }
});
module.exports.MedicinalProductPackaged_PackageItem =
    MedicinalProductPackaged_PackageItem;
