const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const integer = require("../FHIRDataTypesSchema/integer");
const string = require("../FHIRDataTypesSchema/string");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Dosage_DoseAndRate
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const { Dosage } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Dosage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: integer,
    text: string,
    additionalInstruction: {
        type: [CodeableConcept],
        default: void 0
    },
    patientInstruction: string,
    timing: {
        type: Timing,
        default: void 0
    },
    asNeededBoolean: boolean,
    asNeededCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    site: {
        type: CodeableConcept,
        default: void 0
    },
    route: {
        type: CodeableConcept,
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    },
    doseAndRate: {
        type: [Dosage_DoseAndRate],
        default: void 0
    },
    maxDosePerPeriod: {
        type: Ratio,
        default: void 0
    },
    maxDosePerAdministration: {
        type: Quantity,
        default: void 0
    },
    maxDosePerLifetime: {
        type: Quantity,
        default: void 0
    }
});
module.exports.Dosage = Dosage;
