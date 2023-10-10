const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const string = require("../FHIRDataTypesSchema/string");
const {
    ConceptMap_DependsOn
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ConceptMap_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ConceptMap_Target.add({
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
    equivalence: {
        type: String,
        enum: [
            "relatedto",
            "equivalent",
            "equal",
            "wider",
            "subsumes",
            "narrower",
            "specializes",
            "inexact",
            "unmatched",
            "disjoint"
        ],
        default: void 0
    },
    comment: string,
    dependsOn: {
        type: [ConceptMap_DependsOn],
        default: void 0
    },
    product: {
        type: [ConceptMap_DependsOn],
        default: void 0
    }
});
module.exports.ConceptMap_Target = ConceptMap_Target;
