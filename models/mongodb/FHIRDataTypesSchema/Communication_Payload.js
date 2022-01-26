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
    Communication_Payload
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Communication_Payload.add({
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
module.exports.Communication_Payload = Communication_Payload;