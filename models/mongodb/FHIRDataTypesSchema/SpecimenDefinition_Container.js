const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SpecimenDefinition_Additive
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SpecimenDefinition_Container
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SpecimenDefinition_Container.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    material: {
        type: CodeableConcept,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    cap: {
        type: CodeableConcept,
        default: void 0
    },
    description: string,
    capacity: {
        type: Quantity,
        default: void 0
    },
    minimumVolumeQuantity: {
        type: Quantity,
        default: void 0
    },
    minimumVolumeString: string,
    additive: {
        type: [SpecimenDefinition_Additive],
        default: void 0
    },
    preparation: string
});
module.exports.SpecimenDefinition_Container = SpecimenDefinition_Container;