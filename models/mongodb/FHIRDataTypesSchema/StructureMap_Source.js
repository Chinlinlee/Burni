const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const integer = require('../FHIRDataTypesSchema/integer');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
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
    Coding
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
    StructureMap_Source
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureMap_Source.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    context: id,
    min: integer,
    max: string,
    type: string,
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
    element: string,
    listMode: {
        type: String,
        enum: ["first", "not_first", "last", "not_last", "only_one"],
        default: void 0
    },
    variable: id,
    condition: string,
    check: string,
    logMessage: string
});
module.exports.StructureMap_Source = StructureMap_Source;