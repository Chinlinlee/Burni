const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    ClaimResponse_Adjudication
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ClaimResponse_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ClaimResponse_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_Item.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    itemSequence: positiveInt,
    noteNumber: {
        type: [positiveInt],
        default: void 0
    },
    adjudication: {
        type: [ClaimResponse_Adjudication],
        required: true,
        default: void 0
    },
    detail: {
        type: [ClaimResponse_Detail],
        default: void 0
    }
});
module.exports.ClaimResponse_Item = ClaimResponse_Item;
