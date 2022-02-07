const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    AdverseEvent_Causality
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AdverseEvent_Causality.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    assessment: {
        type: CodeableConcept,
        default: void 0
    },
    productRelatedness: string,
    author: {
        type: Reference,
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.AdverseEvent_Causality = AdverseEvent_Causality;