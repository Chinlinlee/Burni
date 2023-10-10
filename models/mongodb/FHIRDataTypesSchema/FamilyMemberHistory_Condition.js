const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Age } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Annotation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    FamilyMemberHistory_Condition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
FamilyMemberHistory_Condition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    outcome: {
        type: CodeableConcept,
        default: void 0
    },
    contributedToDeath: boolean,
    onsetAge: {
        type: Age,
        default: void 0
    },
    onsetRange: {
        type: Range,
        default: void 0
    },
    onsetPeriod: {
        type: Period,
        default: void 0
    },
    onsetString: string,
    note: {
        type: [Annotation],
        default: void 0
    }
});
module.exports.FamilyMemberHistory_Condition = FamilyMemberHistory_Condition;
