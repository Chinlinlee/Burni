const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const uri = require("../FHIRDataTypesSchema/uri");
const canonical = require("../FHIRDataTypesSchema/canonical");
const string = require("../FHIRDataTypesSchema/string");

const {
    ConceptMap_DependsOn
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ConceptMap_DependsOn.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    property: uri,
    system: canonical,
    value: string,
    display: string
});
module.exports.ConceptMap_DependsOn = ConceptMap_DependsOn;
