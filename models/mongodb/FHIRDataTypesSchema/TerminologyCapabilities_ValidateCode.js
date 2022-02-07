const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    TerminologyCapabilities_ValidateCode
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_ValidateCode.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    translations: boolean
});
module.exports.TerminologyCapabilities_ValidateCode = TerminologyCapabilities_ValidateCode;