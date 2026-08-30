const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ElementDefinition_Slicing
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const markdown = require('../FHIRDataTypesSchema/markdown');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');
const {
    ElementDefinition_Base
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const {
    ElementDefinition_Type
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const date = require('../FHIRDataTypesSchema/date');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const instant = require('../FHIRDataTypesSchema/instant');
const time = require('../FHIRDataTypesSchema/time');
const {
    Address
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Age
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ContactPoint
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Count
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Distance
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    HumanName
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Ratio
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SampledData
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Signature
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Contributor
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    DataRequirement
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Expression
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ParameterDefinition
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    RelatedArtifact
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    TriggerDefinition
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    UsageContext
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Dosage
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Meta
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ElementDefinition_Example
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const id = require('../FHIRDataTypesSchema/id');
const {
    ElementDefinition_Constraint
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ElementDefinition_Binding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ElementDefinition_Mapping
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ElementDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ElementDefinition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    path: string,
    representation: {
        type: [String],
        default: void 0
    },
    sliceName: string,
    sliceIsConstraining: boolean,
    label: string,
    code: {
        type: [Coding],
        default: void 0
    },
    slicing: {
        type: ElementDefinition_Slicing,
        default: void 0
    },
    short: string,
    definition: markdown,
    comment: markdown,
    requirements: markdown,
    alias: {
        type: [string],
        default: void 0
    },
    min: unsignedInt,
    max: string,
    base: {
        type: ElementDefinition_Base,
        default: void 0
    },
    contentReference: uri,
    type: {
        type: [ElementDefinition_Type],
        default: void 0
    },
    defaultValueBase64Binary: string,
    defaultValueBoolean: boolean,
    defaultValueCanonical: string,
    defaultValueCode: string,
    defaultValueDate: date,
    defaultValueDateTime: dateTime,
    defaultValueDecimal: {
        type: Number,
        default: void 0
    },
    defaultValueId: string,
    defaultValueInstant: instant,
    defaultValueInteger: {
        type: Number,
        default: void 0
    },
    defaultValueMarkdown: string,
    defaultValueOid: string,
    defaultValuePositiveInt: {
        type: Number,
        default: void 0
    },
    defaultValueString: string,
    defaultValueTime: time,
    defaultValueUnsignedInt: {
        type: Number,
        default: void 0
    },
    defaultValueUri: string,
    defaultValueUrl: string,
    defaultValueUuid: string,
    defaultValueAddress: {
        type: Address,
        default: void 0
    },
    defaultValueAge: {
        type: Age,
        default: void 0
    },
    defaultValueAnnotation: {
        type: Annotation,
        default: void 0
    },
    defaultValueAttachment: {
        type: Attachment,
        default: void 0
    },
    defaultValueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    defaultValueCoding: {
        type: Coding,
        default: void 0
    },
    defaultValueContactPoint: {
        type: ContactPoint,
        default: void 0
    },
    defaultValueCount: {
        type: Count,
        default: void 0
    },
    defaultValueDistance: {
        type: Distance,
        default: void 0
    },
    defaultValueDuration: {
        type: Duration,
        default: void 0
    },
    defaultValueHumanName: {
        type: HumanName,
        default: void 0
    },
    defaultValueIdentifier: {
        type: Identifier,
        default: void 0
    },
    defaultValueMoney: {
        type: Money,
        default: void 0
    },
    defaultValuePeriod: {
        type: Period,
        default: void 0
    },
    defaultValueQuantity: {
        type: Quantity,
        default: void 0
    },
    defaultValueRange: {
        type: Range,
        default: void 0
    },
    defaultValueRatio: {
        type: Ratio,
        default: void 0
    },
    defaultValueReference: {
        type: Reference,
        default: void 0
    },
    defaultValueSampledData: {
        type: SampledData,
        default: void 0
    },
    defaultValueSignature: {
        type: Signature,
        default: void 0
    },
    defaultValueTiming: {
        type: Timing,
        default: void 0
    },
    defaultValueContactDetail: {
        type: ContactDetail,
        default: void 0
    },
    defaultValueContributor: {
        type: Contributor,
        default: void 0
    },
    defaultValueDataRequirement: {
        type: DataRequirement,
        default: void 0
    },
    defaultValueExpression: {
        type: Expression,
        default: void 0
    },
    defaultValueParameterDefinition: {
        type: ParameterDefinition,
        default: void 0
    },
    defaultValueRelatedArtifact: {
        type: RelatedArtifact,
        default: void 0
    },
    defaultValueTriggerDefinition: {
        type: TriggerDefinition,
        default: void 0
    },
    defaultValueUsageContext: {
        type: UsageContext,
        default: void 0
    },
    defaultValueDosage: {
        type: Dosage,
        default: void 0
    },
    defaultValueMeta: {
        type: Meta,
        default: void 0
    },
    meaningWhenMissing: markdown,
    orderMeaning: string,
    fixedBase64Binary: string,
    fixedBoolean: boolean,
    fixedCanonical: string,
    fixedCode: string,
    fixedDate: date,
    fixedDateTime: dateTime,
    fixedDecimal: {
        type: Number,
        default: void 0
    },
    fixedId: string,
    fixedInstant: instant,
    fixedInteger: {
        type: Number,
        default: void 0
    },
    fixedMarkdown: string,
    fixedOid: string,
    fixedPositiveInt: {
        type: Number,
        default: void 0
    },
    fixedString: string,
    fixedTime: time,
    fixedUnsignedInt: {
        type: Number,
        default: void 0
    },
    fixedUri: string,
    fixedUrl: string,
    fixedUuid: string,
    fixedAddress: {
        type: Address,
        default: void 0
    },
    fixedAge: {
        type: Age,
        default: void 0
    },
    fixedAnnotation: {
        type: Annotation,
        default: void 0
    },
    fixedAttachment: {
        type: Attachment,
        default: void 0
    },
    fixedCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    fixedCoding: {
        type: Coding,
        default: void 0
    },
    fixedContactPoint: {
        type: ContactPoint,
        default: void 0
    },
    fixedCount: {
        type: Count,
        default: void 0
    },
    fixedDistance: {
        type: Distance,
        default: void 0
    },
    fixedDuration: {
        type: Duration,
        default: void 0
    },
    fixedHumanName: {
        type: HumanName,
        default: void 0
    },
    fixedIdentifier: {
        type: Identifier,
        default: void 0
    },
    fixedMoney: {
        type: Money,
        default: void 0
    },
    fixedPeriod: {
        type: Period,
        default: void 0
    },
    fixedQuantity: {
        type: Quantity,
        default: void 0
    },
    fixedRange: {
        type: Range,
        default: void 0
    },
    fixedRatio: {
        type: Ratio,
        default: void 0
    },
    fixedReference: {
        type: Reference,
        default: void 0
    },
    fixedSampledData: {
        type: SampledData,
        default: void 0
    },
    fixedSignature: {
        type: Signature,
        default: void 0
    },
    fixedTiming: {
        type: Timing,
        default: void 0
    },
    fixedContactDetail: {
        type: ContactDetail,
        default: void 0
    },
    fixedContributor: {
        type: Contributor,
        default: void 0
    },
    fixedDataRequirement: {
        type: DataRequirement,
        default: void 0
    },
    fixedExpression: {
        type: Expression,
        default: void 0
    },
    fixedParameterDefinition: {
        type: ParameterDefinition,
        default: void 0
    },
    fixedRelatedArtifact: {
        type: RelatedArtifact,
        default: void 0
    },
    fixedTriggerDefinition: {
        type: TriggerDefinition,
        default: void 0
    },
    fixedUsageContext: {
        type: UsageContext,
        default: void 0
    },
    fixedDosage: {
        type: Dosage,
        default: void 0
    },
    fixedMeta: {
        type: Meta,
        default: void 0
    },
    patternBase64Binary: string,
    patternBoolean: boolean,
    patternCanonical: string,
    patternCode: string,
    patternDate: date,
    patternDateTime: dateTime,
    patternDecimal: {
        type: Number,
        default: void 0
    },
    patternId: string,
    patternInstant: instant,
    patternInteger: {
        type: Number,
        default: void 0
    },
    patternMarkdown: string,
    patternOid: string,
    patternPositiveInt: {
        type: Number,
        default: void 0
    },
    patternString: string,
    patternTime: time,
    patternUnsignedInt: {
        type: Number,
        default: void 0
    },
    patternUri: string,
    patternUrl: string,
    patternUuid: string,
    patternAddress: {
        type: Address,
        default: void 0
    },
    patternAge: {
        type: Age,
        default: void 0
    },
    patternAnnotation: {
        type: Annotation,
        default: void 0
    },
    patternAttachment: {
        type: Attachment,
        default: void 0
    },
    patternCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    patternCoding: {
        type: Coding,
        default: void 0
    },
    patternContactPoint: {
        type: ContactPoint,
        default: void 0
    },
    patternCount: {
        type: Count,
        default: void 0
    },
    patternDistance: {
        type: Distance,
        default: void 0
    },
    patternDuration: {
        type: Duration,
        default: void 0
    },
    patternHumanName: {
        type: HumanName,
        default: void 0
    },
    patternIdentifier: {
        type: Identifier,
        default: void 0
    },
    patternMoney: {
        type: Money,
        default: void 0
    },
    patternPeriod: {
        type: Period,
        default: void 0
    },
    patternQuantity: {
        type: Quantity,
        default: void 0
    },
    patternRange: {
        type: Range,
        default: void 0
    },
    patternRatio: {
        type: Ratio,
        default: void 0
    },
    patternReference: {
        type: Reference,
        default: void 0
    },
    patternSampledData: {
        type: SampledData,
        default: void 0
    },
    patternSignature: {
        type: Signature,
        default: void 0
    },
    patternTiming: {
        type: Timing,
        default: void 0
    },
    patternContactDetail: {
        type: ContactDetail,
        default: void 0
    },
    patternContributor: {
        type: Contributor,
        default: void 0
    },
    patternDataRequirement: {
        type: DataRequirement,
        default: void 0
    },
    patternExpression: {
        type: Expression,
        default: void 0
    },
    patternParameterDefinition: {
        type: ParameterDefinition,
        default: void 0
    },
    patternRelatedArtifact: {
        type: RelatedArtifact,
        default: void 0
    },
    patternTriggerDefinition: {
        type: TriggerDefinition,
        default: void 0
    },
    patternUsageContext: {
        type: UsageContext,
        default: void 0
    },
    patternDosage: {
        type: Dosage,
        default: void 0
    },
    patternMeta: {
        type: Meta,
        default: void 0
    },
    example: {
        type: [ElementDefinition_Example],
        default: void 0
    },
    minValueDate: date,
    minValueDateTime: dateTime,
    minValueInstant: instant,
    minValueTime: time,
    minValueDecimal: {
        type: Number,
        default: void 0
    },
    minValueInteger: {
        type: Number,
        default: void 0
    },
    minValuePositiveInt: {
        type: Number,
        default: void 0
    },
    minValueUnsignedInt: {
        type: Number,
        default: void 0
    },
    minValueQuantity: {
        type: Quantity,
        default: void 0
    },
    maxValueDate: date,
    maxValueDateTime: dateTime,
    maxValueInstant: instant,
    maxValueTime: time,
    maxValueDecimal: {
        type: Number,
        default: void 0
    },
    maxValueInteger: {
        type: Number,
        default: void 0
    },
    maxValuePositiveInt: {
        type: Number,
        default: void 0
    },
    maxValueUnsignedInt: {
        type: Number,
        default: void 0
    },
    maxValueQuantity: {
        type: Quantity,
        default: void 0
    },
    maxLength: integer,
    condition: {
        type: [id],
        default: void 0
    },
    constraint: {
        type: [ElementDefinition_Constraint],
        default: void 0
    },
    mustSupport: boolean,
    isModifier: boolean,
    isModifierReason: string,
    isSummary: boolean,
    binding: {
        type: ElementDefinition_Binding,
        default: void 0
    },
    mapping: {
        type: [ElementDefinition_Mapping],
        default: void 0
    },
    _path: {
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
    _representation: {
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
    _sliceName: {
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
    _sliceIsConstraining: {
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
    _label: {
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
    _short: {
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
    _definition: {
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
    _comment: {
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
    _requirements: {
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
    _alias: {
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
    _min: {
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
    _max: {
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
    _contentReference: {
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
    _defaultValueBase64Binary: {
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
    _defaultValueBoolean: {
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
    _defaultValueCanonical: {
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
    _defaultValueCode: {
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
    _defaultValueDate: {
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
    _defaultValueDateTime: {
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
    _defaultValueDecimal: {
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
    _defaultValueId: {
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
    _defaultValueInstant: {
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
    _defaultValueInteger: {
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
    _defaultValueMarkdown: {
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
    _defaultValueOid: {
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
    _defaultValuePositiveInt: {
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
    _defaultValueString: {
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
    _defaultValueTime: {
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
    _defaultValueUnsignedInt: {
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
    _defaultValueUri: {
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
    _defaultValueUrl: {
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
    _defaultValueUuid: {
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
    _meaningWhenMissing: {
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
    _orderMeaning: {
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
    _fixedBase64Binary: {
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
    _fixedBoolean: {
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
    _fixedCanonical: {
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
    _fixedCode: {
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
    _fixedDate: {
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
    _fixedDateTime: {
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
    _fixedDecimal: {
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
    _fixedId: {
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
    _fixedInstant: {
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
    _fixedInteger: {
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
    _fixedMarkdown: {
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
    _fixedOid: {
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
    _fixedPositiveInt: {
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
    _fixedString: {
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
    _fixedTime: {
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
    _fixedUnsignedInt: {
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
    _fixedUri: {
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
    _fixedUrl: {
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
    _fixedUuid: {
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
    _patternBase64Binary: {
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
    _patternBoolean: {
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
    _patternCanonical: {
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
    _patternCode: {
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
    _patternDate: {
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
    _patternDateTime: {
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
    _patternDecimal: {
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
    _patternId: {
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
    _patternInstant: {
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
    _patternInteger: {
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
    _patternMarkdown: {
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
    _patternOid: {
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
    _patternPositiveInt: {
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
    _patternString: {
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
    _patternTime: {
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
    _patternUnsignedInt: {
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
    _patternUri: {
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
    _patternUrl: {
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
    _patternUuid: {
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
    _minValueDate: {
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
    _minValueDateTime: {
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
    _minValueInstant: {
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
    _minValueTime: {
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
    _minValueDecimal: {
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
    _minValueInteger: {
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
    _minValuePositiveInt: {
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
    _minValueUnsignedInt: {
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
    _maxValueDate: {
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
    _maxValueDateTime: {
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
    _maxValueInstant: {
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
    _maxValueTime: {
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
    _maxValueDecimal: {
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
    _maxValueInteger: {
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
    _maxValuePositiveInt: {
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
    _maxValueUnsignedInt: {
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
    _maxLength: {
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
    _condition: {
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
    _mustSupport: {
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
    _isModifier: {
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
    _isModifierReason: {
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
    _isSummary: {
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
module.exports.ElementDefinition = ElementDefinition;