const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");
const code = require("../FHIRDataTypesSchema/code");
const {
    TerminologyCapabilities_Filter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TerminologyCapabilities_Version
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_Version.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: string,
    isDefault: boolean,
    compositional: boolean,
    language: {
        type: [code],
        default: void 0
    },
    filter: {
        type: [TerminologyCapabilities_Filter],
        default: void 0
    },
    property: {
        type: [code],
        default: void 0
    }
});
module.exports.TerminologyCapabilities_Version =
    TerminologyCapabilities_Version;
