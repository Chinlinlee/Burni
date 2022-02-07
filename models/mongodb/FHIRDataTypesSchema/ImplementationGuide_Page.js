const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ImplementationGuide_Page
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Page.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    nameUrl: string,
    nameReference: {
        type: Reference,
        default: void 0
    },
    title: string,
    generation: {
        type: String,
        enum: ["html", "markdown", "xml", "generated"],
        default: void 0
    },
    page: {
        type: [this],
        default: void 0
    }
});
module.exports.ImplementationGuide_Page = ImplementationGuide_Page;