const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    MedicinalProductAuthorization_Procedure
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductAuthorization_Procedure.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    datePeriod: {
        type: Period,
        default: void 0
    },
    dateDateTime: string,
    application: {
        type: [this],
        default: void 0
    }
});
module.exports.MedicinalProductAuthorization_Procedure =
    MedicinalProductAuthorization_Procedure;
