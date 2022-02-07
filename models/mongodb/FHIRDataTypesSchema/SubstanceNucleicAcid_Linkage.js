const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceNucleicAcid_Linkage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceNucleicAcid_Linkage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    connectivity: string,
    identifier: {
        type: Identifier,
        default: void 0
    },
    name: string,
    residueSite: string
});
module.exports.SubstanceNucleicAcid_Linkage = SubstanceNucleicAcid_Linkage;