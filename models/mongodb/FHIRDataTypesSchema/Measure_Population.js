const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Measure_Population
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Measure_Population.add({
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
    criteria: {
        type: Expression,
        required: true,
        default: void 0
    }
});
module.exports.Measure_Population = Measure_Population;
