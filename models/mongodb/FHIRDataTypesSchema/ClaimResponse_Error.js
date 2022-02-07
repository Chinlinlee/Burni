const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ClaimResponse_Error
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_Error.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    itemSequence: positiveInt,
    detailSequence: positiveInt,
    subDetailSequence: positiveInt,
    code: {
        type: CodeableConcept,
        required: true,
        default: void 0
    }
});
module.exports.ClaimResponse_Error = ClaimResponse_Error;