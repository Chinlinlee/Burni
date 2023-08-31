const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    TerminologyCapabilities_Translation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_Translation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    needsMap: boolean
});
module.exports.TerminologyCapabilities_Translation =
    TerminologyCapabilities_Translation;
