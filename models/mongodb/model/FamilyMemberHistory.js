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
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const string = require('../FHIRDataTypesSchema/string');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const date = require('../FHIRDataTypesSchema/date');
const {
    Age
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    FamilyMemberHistory_Condition
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
    const FamilyMemberHistory = {
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
        instantiatesCanonical: {
            type: [canonical],
            default: void 0
        },
        instantiatesUri: {
            type: [uri],
            default: void 0
        },
        status: {
            type: String,
            enum: ["partial", "completed", "entered-in-error", "health-unknown"],
            default: void 0
        },
        dataAbsentReason: {
            type: CodeableConcept,
            default: void 0
        },
        patient: {
            type: Reference,
            required: true,
            default: void 0
        },
        date: dateTime,
        name: string,
        relationship: {
            type: CodeableConcept,
            required: true,
            default: void 0
        },
        sex: {
            type: CodeableConcept,
            default: void 0
        },
        bornPeriod: {
            type: Period,
            default: void 0
        },
        bornDate: date,
        bornString: string,
        ageAge: {
            type: Age,
            default: void 0
        },
        ageRange: {
            type: Range,
            default: void 0
        },
        ageString: string,
        estimatedAge: boolean,
        deceasedBoolean: boolean,
        deceasedAge: {
            type: Age,
            default: void 0
        },
        deceasedRange: {
            type: Range,
            default: void 0
        },
        deceasedDate: date,
        deceasedString: string,
        reasonCode: {
            type: [CodeableConcept],
            default: void 0
        },
        reasonReference: {
            type: [Reference],
            default: void 0
        },
        note: {
            type: [Annotation],
            default: void 0
        },
        condition: {
            type: [FamilyMemberHistory_Condition],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "FamilyMemberHistory"
            ]
        }
    };

    FamilyMemberHistory.id = {
        ...id,
        index: true
    };
    FamilyMemberHistory.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = FamilyMemberHistory;
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
    const FamilyMemberHistorySchema = new mongoose.Schema(FamilyMemberHistory, schemaConfig);


    FamilyMemberHistorySchema.methods.getFHIRField = function() {
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

    FamilyMemberHistorySchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "FamilyMemberHistory") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.FamilyMemberHistory_history.findOne({
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

    FamilyMemberHistorySchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/FamilyMemberHistory/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['FamilyMemberHistory_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/FamilyMemberHistory/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['FamilyMemberHistory_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "FamilyMemberHistory"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    FamilyMemberHistorySchema.pre('findOneAndUpdate', async function(next) {
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

    FamilyMemberHistorySchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/FamilyMemberHistory/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['FamilyMemberHistory_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    FamilyMemberHistorySchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in FamilyMemberHistory resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/FamilyMemberHistory/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['FamilyMemberHistory_history'].create(item);
        next();
    });

    FamilyMemberHistorySchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const FamilyMemberHistoryModel = mongoose.model("FamilyMemberHistory", FamilyMemberHistorySchema, "FamilyMemberHistory");
    return FamilyMemberHistoryModel;
};