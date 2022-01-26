const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstancePolymer_RepeatUnit
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstancePolymer_Repeat
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstancePolymer_Repeat.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    numberOfUnits: integer,
    averageMolecularFormula: string,
    repeatUnitAmountType: {
        type: CodeableConcept,
        default: void 0
    },
    repeatUnit: {
        type: [SubstancePolymer_RepeatUnit],
        default: void 0
    }
});
module.exports.SubstancePolymer_Repeat = SubstancePolymer_Repeat;