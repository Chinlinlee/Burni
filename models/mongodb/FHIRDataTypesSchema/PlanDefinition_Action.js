const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const code = require('../FHIRDataTypesSchema/code');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    RelatedArtifact
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TriggerDefinition
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    PlanDefinition_Condition
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    DataRequirement
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    PlanDefinition_RelatedAction
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Age
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    PlanDefinition_Participant
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    PlanDefinition_DynamicValue
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    PlanDefinition_Action
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_Action.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    prefix: string,
    title: string,
    description: string,
    textEquivalent: string,
    priority: code,
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    reason: {
        type: [CodeableConcept],
        default: void 0
    },
    documentation: {
        type: [RelatedArtifact],
        default: void 0
    },
    goalId: {
        type: [id],
        default: void 0
    },
    subjectCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    subjectReference: {
        type: Reference,
        default: void 0
    },
    trigger: {
        type: [TriggerDefinition],
        default: void 0
    },
    condition: {
        type: [PlanDefinition_Condition],
        default: void 0
    },
    input: {
        type: [DataRequirement],
        default: void 0
    },
    output: {
        type: [DataRequirement],
        default: void 0
    },
    relatedAction: {
        type: [PlanDefinition_RelatedAction],
        default: void 0
    },
    timingDateTime: dateTime,
    timingAge: {
        type: Age,
        default: void 0
    },
    timingPeriod: {
        type: Period,
        default: void 0
    },
    timingDuration: {
        type: Duration,
        default: void 0
    },
    timingRange: {
        type: Range,
        default: void 0
    },
    timingTiming: {
        type: Timing,
        default: void 0
    },
    participant: {
        type: [PlanDefinition_Participant],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    groupingBehavior: {
        type: String,
        enum: ["visual-group", "logical-group", "sentence-group"],
        default: void 0
    },
    selectionBehavior: {
        type: String,
        enum: ["any", "all", "all-or-none", "exactly-one", "at-most-one", "one-or-more"],
        default: void 0
    },
    requiredBehavior: {
        type: String,
        enum: ["must", "could", "must-unless-documented"],
        default: void 0
    },
    precheckBehavior: {
        type: String,
        enum: ["yes", "no"],
        default: void 0
    },
    cardinalityBehavior: {
        type: String,
        enum: ["single", "multiple"],
        default: void 0
    },
    definitionCanonical: string,
    definitionUri: string,
    transform: canonical,
    dynamicValue: {
        type: [PlanDefinition_DynamicValue],
        default: void 0
    },
    action: {
        type: [this],
        default: void 0
    },
    _prefix: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _title: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _description: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _textEquivalent: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _priority: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _goalId: {
        type: [new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        })],
        default: void 0
    },
    _timingDateTime: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _groupingBehavior: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _selectionBehavior: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _requiredBehavior: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _precheckBehavior: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _cardinalityBehavior: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _definitionCanonical: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _definitionUri: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    }
});
module.exports.PlanDefinition_Action = PlanDefinition_Action;