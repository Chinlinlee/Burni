const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    TerminologyCapabilities_Closure
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_Closure.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    translation: boolean
});
module.exports.TerminologyCapabilities_Closure = TerminologyCapabilities_Closure;