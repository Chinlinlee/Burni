const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceSpecification_Moiety
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Moiety.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    role: {
        type: CodeableConcept,
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    name: string,
    stereochemistry: {
        type: CodeableConcept,
        default: void 0
    },
    opticalActivity: {
        type: CodeableConcept,
        default: void 0
    },
    molecularFormula: string,
    amountQuantity: {
        type: Quantity,
        default: void 0
    },
    amountString: string
});
module.exports.SubstanceSpecification_Moiety = SubstanceSpecification_Moiety;