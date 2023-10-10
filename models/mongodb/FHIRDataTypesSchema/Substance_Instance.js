const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Substance_Instance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Substance_Instance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    expiry: dateTime,
    quantity: {
        type: Quantity,
        default: void 0
    }
});
module.exports.Substance_Instance = Substance_Instance;
