const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    ImplementationGuide_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Parameter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: String,
        enum: [
            "apply",
            "path-resource",
            "path-pages",
            "path-tx-cache",
            "expansion-parameter",
            "rule-broken-links",
            "generate-xml",
            "generate-json",
            "generate-turtle",
            "html-template"
        ],
        default: void 0
    },
    value: string
});
module.exports.ImplementationGuide_Parameter = ImplementationGuide_Parameter;
