const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    ClaimResponse_Adjudication
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ClaimResponse_SubDetail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_SubDetail.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    subDetailSequence: positiveInt,
    noteNumber: {
        type: [positiveInt],
        default: void 0
    },
    adjudication: {
        type: [ClaimResponse_Adjudication],
        default: void 0
    }
});
module.exports.ClaimResponse_SubDetail = ClaimResponse_SubDetail;