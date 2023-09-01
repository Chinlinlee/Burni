const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const string = require("../FHIRDataTypesSchema/string");
const {
    StructureMap_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    StructureMap_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Target.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    context: id,
    contextType: {
        type: String,
        enum: ["type", "variable"],
        default: void 0
    },
    element: string,
    variable: id,
    listMode: {
        type: [String],
        default: void 0
    },
    listRuleId: id,
    transform: {
        type: String,
        enum: [
            "create",
            "copy",
            "truncate",
            "escape",
            "cast",
            "append",
            "translate",
            "reference",
            "dateOp",
            "uuid",
            "pointer",
            "evaluate",
            "cc",
            "c",
            "qty",
            "id",
            "cp"
        ],
        default: void 0
    },
    parameter: {
        type: [StructureMap_Parameter],
        default: void 0
    }
});
module.exports.StructureMap_Target = StructureMap_Target;
