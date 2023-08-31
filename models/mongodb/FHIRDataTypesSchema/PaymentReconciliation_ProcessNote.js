const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    PaymentReconciliation_ProcessNote
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PaymentReconciliation_ProcessNote.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["display", "print", "printoper"],
        default: void 0
    },
    text: string
});
module.exports.PaymentReconciliation_ProcessNote =
    PaymentReconciliation_ProcessNote;
