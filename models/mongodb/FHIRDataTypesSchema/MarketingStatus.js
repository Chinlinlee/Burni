const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");

const {
    MarketingStatus
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MarketingStatus.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    country: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    jurisdiction: {
        type: CodeableConcept,
        default: void 0
    },
    status: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    dateRange: {
        type: Period,
        required: true,
        default: void 0
    },
    restoreDate: dateTime
});
module.exports.MarketingStatus = MarketingStatus;
