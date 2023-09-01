const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const integer = require("../FHIRDataTypesSchema/integer");

const {
    RiskEvidenceSynthesis_SampleSize
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RiskEvidenceSynthesis_SampleSize.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    numberOfStudies: integer,
    numberOfParticipants: integer
});
module.exports.RiskEvidenceSynthesis_SampleSize =
    RiskEvidenceSynthesis_SampleSize;
