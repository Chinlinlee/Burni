const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Goal_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Goal_Target.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    measure: {
        type: CodeableConcept,
        default: void 0
    },
    detailQuantity: {
        type: Quantity,
        default: void 0
    },
    detailRange: {
        type: Range,
        default: void 0
    },
    detailCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    detailString: string,
    detailBoolean: boolean,
    detailInteger: {
        type: Number,
        default: void 0
    },
    detailRatio: {
        type: Ratio,
        default: void 0
    },
    dueDate: string,
    dueDuration: {
        type: Duration,
        default: void 0
    }
});
module.exports.Goal_Target = Goal_Target;
