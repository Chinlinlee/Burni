const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    SubstanceSpecification_Official
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceSpecification_Name
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Name.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    status: {
        type: CodeableConcept,
        default: void 0
    },
    preferred: boolean,
    language: {
        type: [CodeableConcept],
        default: void 0
    },
    domain: {
        type: [CodeableConcept],
        default: void 0
    },
    jurisdiction: {
        type: [CodeableConcept],
        default: void 0
    },
    synonym: {
        type: [this],
        default: void 0
    },
    translation: {
        type: [this],
        default: void 0
    },
    official: {
        type: [SubstanceSpecification_Official],
        default: void 0
    },
    source: {
        type: [Reference],
        default: void 0
    }
});
module.exports.SubstanceSpecification_Name = SubstanceSpecification_Name;
