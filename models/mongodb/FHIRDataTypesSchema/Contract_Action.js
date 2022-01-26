const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Contract_Subject
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');

const {
    Contract_Action
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Action.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    doNotPerform: boolean,
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    subject: {
        type: [Contract_Subject],
        default: void 0
    },
    intent: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    linkId: {
        type: [string],
        default: void 0
    },
    status: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    context: {
        type: Reference,
        default: void 0
    },
    contextLinkId: {
        type: [string],
        default: void 0
    },
    occurrenceDateTime: string,
    occurrencePeriod: {
        type: Period,
        default: void 0
    },
    occurrenceTiming: {
        type: Timing,
        default: void 0
    },
    requester: {
        type: [Reference],
        default: void 0
    },
    requesterLinkId: {
        type: [string],
        default: void 0
    },
    performerType: {
        type: [CodeableConcept],
        default: void 0
    },
    performerRole: {
        type: CodeableConcept,
        default: void 0
    },
    performer: {
        type: Reference,
        default: void 0
    },
    performerLinkId: {
        type: [string],
        default: void 0
    },
    reasonCode: {
        type: [CodeableConcept],
        default: void 0
    },
    reasonReference: {
        type: [Reference],
        default: void 0
    },
    reason: {
        type: [string],
        default: void 0
    },
    reasonLinkId: {
        type: [string],
        default: void 0
    },
    note: {
        type: [Annotation],
        default: void 0
    },
    securityLabelNumber: {
        type: [unsignedInt],
        default: void 0
    }
});
module.exports.Contract_Action = Contract_Action;