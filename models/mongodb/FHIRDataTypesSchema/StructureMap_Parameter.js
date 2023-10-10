const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    StructureMap_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Parameter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    valueId: string,
    valueString: string,
    valueBoolean: boolean,
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueDecimal: {
        type: Number,
        default: void 0
    }
});
module.exports.StructureMap_Parameter = StructureMap_Parameter;
