const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    AuditEvent_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AuditEvent_Detail.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: string,
    valueString: string,
    valueBase64Binary: string
});
module.exports.AuditEvent_Detail = AuditEvent_Detail;