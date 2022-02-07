const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    BiologicallyDerivedProduct_Collection
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
BiologicallyDerivedProduct_Collection.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    collector: {
        type: Reference,
        default: void 0
    },
    source: {
        type: Reference,
        default: void 0
    },
    collectedDateTime: string,
    collectedPeriod: {
        type: Period,
        default: void 0
    }
});
module.exports.BiologicallyDerivedProduct_Collection = BiologicallyDerivedProduct_Collection;