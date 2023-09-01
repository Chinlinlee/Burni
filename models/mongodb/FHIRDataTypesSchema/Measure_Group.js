const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Measure_Population
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Measure_Stratifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Measure_Group
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Measure_Group.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    description: string,
    population: {
        type: [Measure_Population],
        default: void 0
    },
    stratifier: {
        type: [Measure_Stratifier],
        default: void 0
    }
});
module.exports.Measure_Group = Measure_Group;
