const mongoose = require('mongoose');
const Extension = require('./Extension');
const string = require('./string');
const boolean = require('./boolean');
const Address = require('./Address');
const Age = require('./Age');
const Annotation = require('./Annotation');
const Attachment = require('./Attachment');
const CodeableConcept = require('./CodeableConcept');
const Coding = require('./Coding');
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
module.exports = new mongoose.Schema({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    label: string,
    valueBase64Binary: string,
    valueBoolean: boolean,
    valueCanonical: string,
    valueCode: string,
    valueDate: string,
    valueDateTime: string,
    valueDecimal: {
        type: Number,
        default: void 0
    },
    valueId: string,
    valueInstant: string,
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueMarkdown: string,
    valueOid: string,
    valuePositiveInt: {
        type: Number,
        default: void 0
    },
    valueString: string,
    valueTime: string,
    valueUnsignedInt: {
        type: Number,
        default: void 0
    },
    valueUri: string,
    valueUrl: string,
    valueUuid: string,
    valueAddress: {
        type: Address,
        default: void 0
    },
    valueAge: {
        type: Age,
        default: void 0
    },
    valueAnnotation: {
        type: Annotation,
        default: void 0
    },
    valueAttachment: {
        type: Attachment,
        default: void 0
    },
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueCoding: {
        type: Coding,
        default: void 0
    },
    valueContactPoint: {
        type: ContactPoint,
        default: void 0
    },
    valueCount: {
        type: Count,
        default: void 0
    },
    valueDistance: {
        type: Distance,
        default: void 0
    },
    valueDuration: {
        type: Duration,
        default: void 0
    },
    valueHumanName: {
        type: HumanName,
        default: void 0
    },
    valueIdentifier: {
        type: Identifier,
        default: void 0
    },
    valueMoney: {
        type: Money,
        default: void 0
    },
    valuePeriod: {
        type: Period,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueRange: {
        type: Range,
        default: void 0
    },
    valueRatio: {
        type: Ratio,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    },
    valueSampledData: {
        type: SampledData,
        default: void 0
    },
    valueSignature: {
        type: Signature,
        default: void 0
    },
    valueTiming: {
        type: Timing,
        default: void 0
    },
    valueContactDetail: {
        type: ContactDetail,
        default: void 0
    },
    valueContributor: {
        type: Contributor,
        default: void 0
    },
    valueDataRequirement: {
        type: DataRequirement,
        default: void 0
    },
    valueExpression: {
        type: Expression,
        default: void 0
    },
    valueParameterDefinition: {
        type: ParameterDefinition,
        default: void 0
    },
    valueRelatedArtifact: {
        type: RelatedArtifact,
        default: void 0
    },
    valueTriggerDefinition: {
        type: TriggerDefinition,
        default: void 0
    },
    valueUsageContext: {
        type: UsageContext,
        default: void 0
    },
    valueDosage: {
        type: Dosage,
        default: void 0
    },
    valueMeta: {
        type: Meta,
        default: void 0
    }
}, {
    _id: false,
    id: false,
    toObject: {
        getters: true
    }
});