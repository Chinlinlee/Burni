const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ProdCharacteristic
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ProdCharacteristic.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    height: {
        type: Quantity,
        default: void 0
    },
    width: {
        type: Quantity,
        default: void 0
    },
    depth: {
        type: Quantity,
        default: void 0
    },
    weight: {
        type: Quantity,
        default: void 0
    },
    nominalVolume: {
        type: Quantity,
        default: void 0
    },
    externalDiameter: {
        type: Quantity,
        default: void 0
    },
    shape: string,
    color: {
        type: [string],
        default: void 0
    },
    imprint: {
        type: [string],
        default: void 0
    },
    image: {
        type: [Attachment],
        default: void 0
    },
    scoring: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.ProdCharacteristic = ProdCharacteristic;
