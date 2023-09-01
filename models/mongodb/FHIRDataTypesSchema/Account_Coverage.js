const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");

const {
    Account_Coverage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Account_Coverage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    coverage: {
        type: Reference,
        required: true,
        default: void 0
    },
    priority: positiveInt
});
module.exports.Account_Coverage = Account_Coverage;
