const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImplementationGuide_Grouping
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImplementationGuide_Resource
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImplementationGuide_Page
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImplementationGuide_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImplementationGuide_Template
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ImplementationGuide_Definition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImplementationGuide_Definition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    grouping: {
        type: [ImplementationGuide_Grouping],
        default: void 0
    },
    resource: {
        type: [ImplementationGuide_Resource],
        required: true,
        default: void 0
    },
    page: {
        type: ImplementationGuide_Page,
        default: void 0
    },
    parameter: {
        type: [ImplementationGuide_Parameter],
        default: void 0
    },
    template: {
        type: [ImplementationGuide_Template],
        default: void 0
    }
});
module.exports.ImplementationGuide_Definition = ImplementationGuide_Definition;
