const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    DataRequirement_DateFilter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DataRequirement_DateFilter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    searchParam: string,
    valueDateTime: string,
    valuePeriod: {
        type: Period,
        default: void 0
    },
    valueDuration: {
        type: Duration,
        default: void 0
    }
});
module.exports.DataRequirement_DateFilter = DataRequirement_DateFilter;
