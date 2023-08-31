const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const string = require("../FHIRDataTypesSchema/string");
const url = require("../FHIRDataTypesSchema/url");

const {
    ImplementationGuide_Resource1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Resource1.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    reference: {
        type: Reference,
        required: true,
        default: void 0
    },
    exampleBoolean: boolean,
    exampleCanonical: string,
    relativePath: url
});
module.exports.ImplementationGuide_Resource1 = ImplementationGuide_Resource1;
