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
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ClinicalImpression_Investigation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ClinicalImpression_Finding
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Annotation
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
module.exports = function(connection = mongoose) {
    const modelConnection = connection;
    const ClinicalImpression = {
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
        identifier: {
            type: [Identifier],
            default: void 0
        },
        status: code,
        statusReason: {
            type: CodeableConcept,
            default: void 0
        },
        code: {
            type: CodeableConcept,
            default: void 0
        },
        description: string,
        subject: {
            type: Reference,
            required: true,
            default: void 0
        },
        encounter: {
            type: Reference,
            default: void 0
        },
        effectiveDateTime: dateTime,
        effectivePeriod: {
            type: Period,
            default: void 0
        },
        date: dateTime,
        assessor: {
            type: Reference,
            default: void 0
        },
        previous: {
            type: Reference,
            default: void 0
        },
        problem: {
            type: [Reference],
            default: void 0
        },
        investigation: {
            type: [ClinicalImpression_Investigation],
            default: void 0
        },
        protocol: {
            type: [uri],
            default: void 0
        },
        summary: string,
        finding: {
            type: [ClinicalImpression_Finding],
            default: void 0
        },
        prognosisCodeableConcept: {
            type: [CodeableConcept],
            default: void 0
        },
        prognosisReference: {
            type: [Reference],
            default: void 0
        },
        supportingInfo: {
            type: [Reference],
            default: void 0
        },
        note: {
            type: [Annotation],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "ClinicalImpression"
            ]
        }
    };

    ClinicalImpression.id = {
        ...id,
        index: true
    };
    ClinicalImpression.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ClinicalImpression;
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
    const ClinicalImpressionSchema = new mongoose.Schema(ClinicalImpression, schemaConfig);


    ClinicalImpressionSchema.methods.getFHIRField = function() {
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

    ClinicalImpressionSchema.pre('save', async function(next) {
        const mongodb = modelConnection;
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.model("FHIRStoredID").findOne({
                id: this.id
            });
            if (storedID.resourceType != "ClinicalImpression") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.model("ClinicalImpression_history").findOne({
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

    ClinicalImpressionSchema.post('save', async function(result) {
        const mongodb = modelConnection;
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ClinicalImpression/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb.model("ClinicalImpression_history").create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ClinicalImpression/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb.model("ClinicalImpression_history").create(item);
        }
        await mongodb.model("FHIRStoredID").findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "ClinicalImpression"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item, modelConnection);
    });

    ClinicalImpressionSchema.pre('findOneAndUpdate', async function(next) {
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

    ClinicalImpressionSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ClinicalImpression/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await modelConnection.model("ClinicalImpression_history").create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item, modelConnection);

        return result;
    });

    ClinicalImpressionSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in ClinicalImpression resource`);
        }
        let item = docToDelete.toObject();
        delete item._id;

        if (process.env.ENABLE_CHECK_REF_DELETION === "true" && await checkResourceHaveReferenceByOthers(item, modelConnection)) {
            next(`The ${item.resourceType}:id->${item.id} is referenced by multiple resource, please do not delete resource that have association`);
        }

        item.meta.versionId = String(Number(item.meta.versionId) + 1);
        let version = item.meta.versionId;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        _.set(item, "request", {
            "method": "DELETE",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ClinicalImpression/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await modelConnection.model("ClinicalImpression_history").create(item);
        next();
    });

    ClinicalImpressionSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource, modelConnection);
        await deleteEmptyRefBy(modelConnection);
    });

    const ClinicalImpressionModel = modelConnection.model("ClinicalImpression", ClinicalImpressionSchema, "ClinicalImpression");
    return ClinicalImpressionModel;
};