const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    Group_Member
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Group_Member.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    entity: {
        type: Reference,
        required: true,
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    },
    inactive: boolean
});
module.exports.Group_Member = Group_Member;
