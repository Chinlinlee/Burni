const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const boolean = require('./boolean');
const Coding = require('./Coding');
const ElementDefinition_Slicing = require('./ElementDefinition_Slicing');
const markdown = require('./markdown');
const unsignedInt = require('./unsignedInt');
const ElementDefinition_Base = require('./ElementDefinition_Base');
const uri = require('./uri');
const ElementDefinition_Type = require('./ElementDefinition_Type');
const Address = require('./Address');
const Age = require('./Age');
const Annotation = require('./Annotation');
const Attachment = require('./Attachment');
const CodeableConcept = require('./CodeableConcept');
const ContactPoint = require('./ContactPoint');
const Count = require('./Count');
const Distance = require('./Distance');
const Duration = require('./Duration');
const HumanName = require('./HumanName');
const Identifier = require('./Identifier');
const Money = require('./Money');
const Period = require('./Period');
const Quantity = require('./Quantity');
const Range = require('./Range');
const Ratio = require('./Ratio');
const Reference = require('./Reference');
const SampledData = require('./SampledData');
const Signature = require('./Signature');
const Timing = require('./Timing');
const ContactDetail = require('./ContactDetail');
const Contributor = require('./Contributor');
const DataRequirement = require('./DataRequirement');
const Expression = require('./Expression');
const ParameterDefinition = require('./ParameterDefinition');
const RelatedArtifact = require('./RelatedArtifact');
const TriggerDefinition = require('./TriggerDefinition');
const UsageContext = require('./UsageContext');
const Dosage = require('./Dosage');
const Meta = require('./Meta');
const ElementDefinition_Example = require('./ElementDefinition_Example');
const integer = require('./integer');
const id = require('./id');
const ElementDefinition_Constraint = require('./ElementDefinition_Constraint');
const ElementDefinition_Binding = require('./ElementDefinition_Binding');
const ElementDefinition_Mapping = require('./ElementDefinition_Mapping');
module.exports = new mongoose.Schema({
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
    defaultValueDate: string,
    defaultValueDateTime: string,
    defaultValueDecimal: {
        type: Number,
        default: void 0
    },
    defaultValueId: string,
    defaultValueInstant: string,
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
    defaultValueTime: string,
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
    fixedDate: string,
    fixedDateTime: string,
    fixedDecimal: {
        type: Number,
        default: void 0
    },
    fixedId: string,
    fixedInstant: string,
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
    fixedTime: string,
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
    patternDate: string,
    patternDateTime: string,
    patternDecimal: {
        type: Number,
        default: void 0
    },
    patternId: string,
    patternInstant: string,
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
    patternTime: string,
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
    minValueDate: string,
    minValueDateTime: string,
    minValueInstant: string,
    minValueTime: string,
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
    maxValueDate: string,
    maxValueDateTime: string,
    maxValueInstant: string,
    maxValueTime: string,
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
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});