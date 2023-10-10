const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    SubstanceNucleicAcid_Sugar
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceNucleicAcid_Sugar.add({
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
    name: string,
    residueSite: string
});
module.exports.SubstanceNucleicAcid_Sugar = SubstanceNucleicAcid_Sugar;
