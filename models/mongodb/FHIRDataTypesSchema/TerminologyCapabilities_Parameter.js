const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");

const {
    TerminologyCapabilities_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_Parameter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: code,
    documentation: string
});
module.exports.TerminologyCapabilities_Parameter =
    TerminologyCapabilities_Parameter;
