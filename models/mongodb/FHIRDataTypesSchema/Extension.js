const mongoose = require("mongoose");
const uri = require("../FHIRDataTypesSchema/uri");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Address } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Age } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Annotation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ContactPoint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Count } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Distance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    HumanName
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SampledData
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Signature
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Timing } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ContactDetail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Contributor
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    DataRequirement
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Expression
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ParameterDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    RelatedArtifact
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    TriggerDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    UsageContext
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Dosage } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Meta } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Extension.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    url: uri,
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
});
module.exports.Extension = Extension;
