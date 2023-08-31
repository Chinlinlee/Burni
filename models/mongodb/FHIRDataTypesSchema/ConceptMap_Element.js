const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");
const {
    ConceptMap_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ConceptMap_Element
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ConceptMap_Element.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    display: string,
    target: {
        type: [ConceptMap_Target],
        default: void 0
    }
});
module.exports.ConceptMap_Element = ConceptMap_Element;
