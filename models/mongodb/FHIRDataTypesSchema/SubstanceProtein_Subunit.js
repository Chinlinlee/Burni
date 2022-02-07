const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const string = require('../FHIRDataTypesSchema/string');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceProtein_Subunit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceProtein_Subunit.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    subunit: integer,
    sequence: string,
    length: integer,
    sequenceAttachment: {
        type: Attachment,
        default: void 0
    },
    nTerminalModificationId: {
        type: Identifier,
        default: void 0
    },
    nTerminalModification: string,
    cTerminalModificationId: {
        type: Identifier,
        default: void 0
    },
    cTerminalModification: string
});
module.exports.SubstanceProtein_Subunit = SubstanceProtein_Subunit;