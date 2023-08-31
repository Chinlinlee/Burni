const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const canonical = require("../FHIRDataTypesSchema/canonical");
const string = require("../FHIRDataTypesSchema/string");

const {
    SearchParameter_Component
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SearchParameter_Component.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    definition: canonical,
    expression: string
});
module.exports.SearchParameter_Component = SearchParameter_Component;
