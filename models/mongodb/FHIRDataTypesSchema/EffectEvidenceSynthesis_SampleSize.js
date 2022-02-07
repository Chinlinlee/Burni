const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const integer = require('../FHIRDataTypesSchema/integer');

const {
    EffectEvidenceSynthesis_SampleSize
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
EffectEvidenceSynthesis_SampleSize.add({
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
module.exports.EffectEvidenceSynthesis_SampleSize = EffectEvidenceSynthesis_SampleSize;