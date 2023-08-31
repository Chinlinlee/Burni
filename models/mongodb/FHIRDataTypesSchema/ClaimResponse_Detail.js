const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    ClaimResponse_Adjudication
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ClaimResponse_SubDetail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ClaimResponse_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_Detail.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    detailSequence: positiveInt,
    noteNumber: {
        type: [positiveInt],
        default: void 0
    },
    adjudication: {
        type: [ClaimResponse_Adjudication],
        required: true,
        default: void 0
    },
    subDetail: {
        type: [ClaimResponse_SubDetail],
        default: void 0
    }
});
module.exports.ClaimResponse_Detail = ClaimResponse_Detail;
