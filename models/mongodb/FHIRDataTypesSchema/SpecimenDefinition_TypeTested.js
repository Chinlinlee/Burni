const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SpecimenDefinition_Container
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SpecimenDefinition_Handling
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SpecimenDefinition_TypeTested
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SpecimenDefinition_TypeTested.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    isDerived: boolean,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    preference: {
        type: String,
        enum: ["preferred", "alternate"],
        default: void 0
    },
    container: {
        type: SpecimenDefinition_Container,
        default: void 0
    },
    requirement: string,
    retentionTime: {
        type: Duration,
        default: void 0
    },
    rejectionCriterion: {
        type: [CodeableConcept],
        default: void 0
    },
    handling: {
        type: [SpecimenDefinition_Handling],
        default: void 0
    }
});
module.exports.SpecimenDefinition_TypeTested = SpecimenDefinition_TypeTested;
