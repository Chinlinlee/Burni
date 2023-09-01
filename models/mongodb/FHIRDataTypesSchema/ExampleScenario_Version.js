const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const markdown = require("../FHIRDataTypesSchema/markdown");

const {
    ExampleScenario_Version
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Version.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    versionId: string,
    description: markdown
});
module.exports.ExampleScenario_Version = ExampleScenario_Version;
