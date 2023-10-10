const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const string = require("../FHIRDataTypesSchema/string");
const integer = require("../FHIRDataTypesSchema/integer");
const uri = require("../FHIRDataTypesSchema/uri");
const canonical = require("../FHIRDataTypesSchema/canonical");

const {
    TestScript_Capability
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Capability.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    required: boolean,
    validated: boolean,
    description: string,
    origin: {
        type: [integer],
        default: void 0
    },
    destination: integer,
    link: {
        type: [uri],
        default: void 0
    },
    capabilities: canonical
});
module.exports.TestScript_Capability = TestScript_Capability;
