const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Account_Guarantor
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Account_Guarantor.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    party: {
        type: Reference,
        required: true,
        default: void 0
    },
    onHold: boolean,
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.Account_Guarantor = Account_Guarantor;
