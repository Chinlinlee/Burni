const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const canonical = require("../FHIRDataTypesSchema/canonical");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    DataRequirement_CodeFilter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    DataRequirement_DateFilter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    DataRequirement_Sort
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    DataRequirement
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DataRequirement.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: code,
    profile: {
        type: [canonical],
        default: void 0
    },
    subjectCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    subjectReference: {
        type: Reference,
        default: void 0
    },
    mustSupport: {
        type: [string],
        default: void 0
    },
    codeFilter: {
        type: [DataRequirement_CodeFilter],
        default: void 0
    },
    dateFilter: {
        type: [DataRequirement_DateFilter],
        default: void 0
    },
    limit: positiveInt,
    sort: {
        type: [DataRequirement_Sort],
        default: void 0
    }
});
module.exports.DataRequirement = DataRequirement;
