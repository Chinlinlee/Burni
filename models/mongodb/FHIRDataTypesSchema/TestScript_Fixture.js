const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    TestScript_Fixture
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestScript_Fixture.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    autocreate: boolean,
    autodelete: boolean,
    resource: {
        type: Reference,
        default: void 0
    }
});
module.exports.TestScript_Fixture = TestScript_Fixture;
