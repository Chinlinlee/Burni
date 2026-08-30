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
const canonical = require('../FHIRDataTypesSchema/canonical');
const boolean = require('../FHIRDataTypesSchema/boolean');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
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
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ChargeItemDefinition_Applicability
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ChargeItemDefinition_PropertyGroup
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
    const ChargeItemDefinition = {
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
        title: string,
        derivedFromUri: {
            type: [uri],
            default: void 0
        },
        partOf: {
            type: [canonical],
            default: void 0
        },
        replaces: {
            type: [canonical],
            default: void 0
        },
        status: {
            type: String,
            enum: ["draft", "active", "retired", "unknown"],
            default: void 0
        },
        experimental: boolean,
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
        copyright: markdown,
        approvalDate: date,
        lastReviewDate: date,
        effectivePeriod: {
            type: Period,
            default: void 0
        },
        code: {
            type: CodeableConcept,
            default: void 0
        },
        instance: {
            type: [Reference],
            default: void 0
        },
        applicability: {
            type: [ChargeItemDefinition_Applicability],
            default: void 0
        },
        propertyGroup: {
            type: [ChargeItemDefinition_PropertyGroup],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "ChargeItemDefinition"
            ]
        }
    };

    ChargeItemDefinition.id = {
        ...id,
        index: true
    };
    ChargeItemDefinition.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ChargeItemDefinition;
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
    const ChargeItemDefinitionSchema = new mongoose.Schema(ChargeItemDefinition, schemaConfig);


    ChargeItemDefinitionSchema.methods.getFHIRField = function() {
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

    ChargeItemDefinitionSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "ChargeItemDefinition") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.ChargeItemDefinition_history.findOne({
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

    ChargeItemDefinitionSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ChargeItemDefinition/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['ChargeItemDefinition_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ChargeItemDefinition/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['ChargeItemDefinition_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "ChargeItemDefinition"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    ChargeItemDefinitionSchema.pre('findOneAndUpdate', async function(next) {
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

    ChargeItemDefinitionSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ChargeItemDefinition/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['ChargeItemDefinition_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ChargeItemDefinitionSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in ChargeItemDefinition resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ChargeItemDefinition/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['ChargeItemDefinition_history'].create(item);
        next();
    });

    ChargeItemDefinitionSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ChargeItemDefinitionModel = mongoose.model("ChargeItemDefinition", ChargeItemDefinitionSchema, "ChargeItemDefinition");
    return ChargeItemDefinitionModel;
};