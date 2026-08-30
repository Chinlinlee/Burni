const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const {
    Meta
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const uri = require('../FHIRDataTypesSchema/uri');
const code = require('../FHIRDataTypesSchema/code');
const {
    Narrative
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    UsageContext
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const date = require('../FHIRDataTypesSchema/date');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    RelatedArtifact
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Age
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ActivityDefinition_Participant
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Dosage
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ActivityDefinition_DynamicValue
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const id = require('../FHIRDataTypesSchema/id');
const {
    storeResourceRefBy,
    updateRefBy,
    deleteEmptyRefBy,
    checkResourceHaveReferenceByOthers
} = require("../common");
const {
    canonicalInstantFromUtcDate,
    serializeResourceTemporals
} = require("../../FHIR/temporal");
module.exports = function() {
    const ActivityDefinition = {
        meta: {
            type: Meta,
            default: void 0
        },
        implicitRules: uri,
        language: code,
        text: {
            type: Narrative,
            default: void 0
        },
        extension: {
            type: [Extension],
            default: void 0
        },
        modifierExtension: {
            type: [Extension],
            default: void 0
        },
        url: uri,
        identifier: {
            type: [Identifier],
            default: void 0
        },
        version: string,
        name: string,
        title: string,
        subtitle: string,
        status: {
            type: String,
            enum: ["draft", "active", "retired", "unknown"],
            default: void 0
        },
        experimental: boolean,
        subjectCodeableConcept: {
            type: CodeableConcept,
            default: void 0
        },
        subjectReference: {
            type: Reference,
            default: void 0
        },
        date: dateTime,
        publisher: string,
        contact: {
            type: [ContactDetail],
            default: void 0
        },
        description: markdown,
        useContext: {
            type: [UsageContext],
            default: void 0
        },
        jurisdiction: {
            type: [CodeableConcept],
            default: void 0
        },
        purpose: markdown,
        usage: string,
        copyright: markdown,
        approvalDate: date,
        lastReviewDate: date,
        effectivePeriod: {
            type: Period,
            default: void 0
        },
        topic: {
            type: [CodeableConcept],
            default: void 0
        },
        author: {
            type: [ContactDetail],
            default: void 0
        },
        editor: {
            type: [ContactDetail],
            default: void 0
        },
        reviewer: {
            type: [ContactDetail],
            default: void 0
        },
        endorser: {
            type: [ContactDetail],
            default: void 0
        },
        relatedArtifact: {
            type: [RelatedArtifact],
            default: void 0
        },
        library: {
            type: [canonical],
            default: void 0
        },
        kind: code,
        profile: canonical,
        code: {
            type: CodeableConcept,
            default: void 0
        },
        intent: code,
        priority: code,
        doNotPerform: boolean,
        timingTiming: {
            type: Timing,
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
        timingRange: {
            type: Range,
            default: void 0
        },
        timingDuration: {
            type: Duration,
            default: void 0
        },
        location: {
            type: Reference,
            default: void 0
        },
        participant: {
            type: [ActivityDefinition_Participant],
            default: void 0
        },
        productReference: {
            type: Reference,
            default: void 0
        },
        productCodeableConcept: {
            type: CodeableConcept,
            default: void 0
        },
        quantity: {
            type: Quantity,
            default: void 0
        },
        dosage: {
            type: [Dosage],
            default: void 0
        },
        bodySite: {
            type: [CodeableConcept],
            default: void 0
        },
        specimenRequirement: {
            type: [Reference],
            default: void 0
        },
        observationRequirement: {
            type: [Reference],
            default: void 0
        },
        observationResultRequirement: {
            type: [Reference],
            default: void 0
        },
        transform: canonical,
        dynamicValue: {
            type: [ActivityDefinition_DynamicValue],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "ActivityDefinition"
            ]
        }
    };

    ActivityDefinition.id = {
        ...id,
        index: true
    };
    ActivityDefinition.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ActivityDefinition;
    let schemaConfig = {
        toObject: {
            getters: true
        },
        toJSON: {
            getters: true
        },
        versionKey: false
    };
    if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
        schemaConfig["shardKey"] = {
            id: 1
        };
    }
    const ActivityDefinitionSchema = new mongoose.Schema(ActivityDefinition, schemaConfig);


    ActivityDefinitionSchema.methods.getFHIRField = function() {
        let result = this;
        delete result._doc._id;
        delete result._doc.__v;
        let myCollectionField = _.get(result, "_doc.myCollection");
        if (myCollectionField) {
            let tempCollectionField = _.cloneDeep(myCollectionField);
            _.set(result, "_doc.collection", tempCollectionField);
            delete result._doc.myCollection;
        }
        return serializeResourceTemporals(result.toObject());
    };

    ActivityDefinitionSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "ActivityDefinition") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.ActivityDefinition_history.findOne({
                id: this.id
            })
            .sort({
                "meta.versionId": -1
            });

        const nextVersionId = docInHistory ?
            String(Number(_.get(docInHistory, "meta.versionId")) + 1) :
            "1";
        const currentMeta = this.meta && typeof this.meta.toObject === "function" ?
            this.meta.toObject() :
            (this.meta ? {
                ...this.meta
            } : {});
        currentMeta.versionId = nextVersionId;
        currentMeta.lastUpdated = canonicalInstantFromUtcDate(new Date());
        this.set("meta", currentMeta);

        return next();
    });

    ActivityDefinitionSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ActivityDefinition/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['ActivityDefinition_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ActivityDefinition/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['ActivityDefinition_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "ActivityDefinition"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    ActivityDefinitionSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        const currentMeta = docToUpdate.meta && typeof docToUpdate.meta.toObject === "function" ?
            docToUpdate.meta.toObject() :
            {
                ...docToUpdate.meta
            };
        currentMeta.versionId = String(version + 1);
        currentMeta.lastUpdated = canonicalInstantFromUtcDate(new Date());
        this._update.$set.meta = currentMeta;
        return next();
    });

    ActivityDefinitionSchema.post('findOneAndUpdate', async function(result) {
        let mongodb = require('../index');
        let item;
        if (result.value) {
            item = _.cloneDeep(result.value).toObject();
        } else {
            item = _.cloneDeep(result).toObject();
        }
        let version = item.meta.versionId;
        delete item._id;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;

        _.set(item, "request", {
            "method": "PUT",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ActivityDefinition/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['ActivityDefinition_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ActivityDefinitionSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in ActivityDefinition resource`);
        }
        let mongodb = require('../index');
        let item = docToDelete.toObject();
        delete item._id;

        if (process.env.ENABLE_CHECK_REF_DELETION === "true" && await checkResourceHaveReferenceByOthers(item)) {
            next(`The ${item.resourceType}:id->${item.id} is referenced by multiple resource, please do not delete resource that have association`);
        }

        item.meta.versionId = String(Number(item.meta.versionId) + 1);
        let version = item.meta.versionId;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        _.set(item, "request", {
            "method": "DELETE",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ActivityDefinition/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['ActivityDefinition_history'].create(item);
        next();
    });

    ActivityDefinitionSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ActivityDefinitionModel = mongoose.model("ActivityDefinition", ActivityDefinitionSchema, "ActivityDefinition");
    return ActivityDefinitionModel;
};