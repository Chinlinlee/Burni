const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    TerminologyCapabilities_Parameter
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const markdown = require('../FHIRDataTypesSchema/markdown');

const {
    TerminologyCapabilities_Expansion
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TerminologyCapabilities_Expansion.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    hierarchical: boolean,
    paging: boolean,
    incomplete: boolean,
    parameter: {
        type: [TerminologyCapabilities_Parameter],
        default: void 0
    },
    textFilter: markdown
});
module.exports.TerminologyCapabilities_Expansion = TerminologyCapabilities_Expansion;