const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CommunicationRequest_Payload
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CommunicationRequest_Payload.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    contentString: string,
    contentAttachment: {
        type: Attachment,
        default: void 0
    },
    contentReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.CommunicationRequest_Payload = CommunicationRequest_Payload;