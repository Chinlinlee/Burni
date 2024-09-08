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
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    UsageContext
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const date = require('../FHIRDataTypesSchema/date');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    RelatedArtifact
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    EffectEvidenceSynthesis_SampleSize
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    EffectEvidenceSynthesis_ResultsByExposure
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    EffectEvidenceSynthesis_EffectEstimate
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    EffectEvidenceSynthesis_Certainty
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const id = require('../FHIRDataTypesSchema/id');
const {
    storeResourceRefBy,
    updateRefBy,
    deleteEmptyRefBy,
    checkResourceHaveReferenceByOthers
} = require("../common");
module.exports = function() {
    const EffectEvidenceSynthesis = {
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
        status: {
            type: String,
            enum: ["draft", "active", "retired", "unknown"],
            default: void 0
        },
        date: dateTime,
        publisher: string,
        contact: {
            type: [ContactDetail],
            default: void 0
        },
        description: markdown,
        note: {
            type: [Annotation],
            default: void 0
        },
        useContext: {
            type: [UsageContext],
            default: void 0
        },
        jurisdiction: {
            type: [CodeableConcept],
            default: void 0
        },
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
        synthesisType: {
            type: CodeableConcept,
            default: void 0
        },
        studyType: {
            type: CodeableConcept,
            default: void 0
        },
        population: {
            type: Reference,
            required: true,
            default: void 0
        },
        exposure: {
            type: Reference,
            required: true,
            default: void 0
        },
        exposureAlternative: {
            type: Reference,
            required: true,
            default: void 0
        },
        outcome: {
            type: Reference,
            required: true,
            default: void 0
        },
        sampleSize: {
            type: EffectEvidenceSynthesis_SampleSize,
            default: void 0
        },
        resultsByExposure: {
            type: [EffectEvidenceSynthesis_ResultsByExposure],
            default: void 0
        },
        effectEstimate: {
            type: [EffectEvidenceSynthesis_EffectEstimate],
            default: void 0
        },
        certainty: {
            type: [EffectEvidenceSynthesis_Certainty],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "EffectEvidenceSynthesis"
            ]
        }
    };

    EffectEvidenceSynthesis.id = {
        ...id,
        index: true
    };
    EffectEvidenceSynthesis.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = EffectEvidenceSynthesis;
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
    const EffectEvidenceSynthesisSchema = new mongoose.Schema(EffectEvidenceSynthesis, schemaConfig);


    EffectEvidenceSynthesisSchema.methods.getFHIRField = function() {
        let result = this;
        delete result._doc._id;
        delete result._doc.__v;
        let myCollectionField = _.get(result, "_doc.myCollection");
        if (myCollectionField) {
            let tempCollectionField = _.cloneDeep(myCollectionField);
            _.set(result, "_doc.collection", tempCollectionField);
            delete result._doc.myCollection;
        }
        return result.toObject();
    };

    EffectEvidenceSynthesisSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "EffectEvidenceSynthesis") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.EffectEvidenceSynthesis_history.findOne({
                id: this.id
            })
            .sort({
                "meta.versionId": -1
            });

        if (docInHistory) {
            let versionId = Number(_.get(docInHistory, "meta.versionId")) + 1;
            let versionIdStr = String(versionId);
            _.set(this, "meta.versionId", versionIdStr);
            _.set(this, "meta.lastUpdated", new Date());
        } else {
            _.set(this, "meta.versionId", "1");
            _.set(this, "meta.lastUpdated", new Date());
        }

        return next();
    });

    EffectEvidenceSynthesisSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/EffectEvidenceSynthesis/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['EffectEvidenceSynthesis_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/EffectEvidenceSynthesis/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['EffectEvidenceSynthesis_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "EffectEvidenceSynthesis"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    EffectEvidenceSynthesisSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version + 1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    EffectEvidenceSynthesisSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/EffectEvidenceSynthesis/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['EffectEvidenceSynthesis_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    EffectEvidenceSynthesisSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in EffectEvidenceSynthesis resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/EffectEvidenceSynthesis/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['EffectEvidenceSynthesis_history'].create(item);
        next();
    });

    EffectEvidenceSynthesisSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const EffectEvidenceSynthesisModel = mongoose.model("EffectEvidenceSynthesis", EffectEvidenceSynthesisSchema, "EffectEvidenceSynthesis");
    return EffectEvidenceSynthesisModel;
};