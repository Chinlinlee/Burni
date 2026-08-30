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
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    RelatedArtifact
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ResearchStudy_Arm
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ResearchStudy_Objective
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
    const ResearchStudy = {
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
        title: string,
        protocol: {
            type: [Reference],
            default: void 0
        },
        partOf: {
            type: [Reference],
            default: void 0
        },
        status: {
            type: String,
            enum: ["active", "administratively-completed", "approved", "closed-to-accrual", "closed-to-accrual-and-intervention", "completed", "disapproved", "in-review", "temporarily-closed-to-accrual", "temporarily-closed-to-accrual-and-intervention", "withdrawn"],
            default: void 0
        },
        primaryPurposeType: {
            type: CodeableConcept,
            default: void 0
        },
        phase: {
            type: CodeableConcept,
            default: void 0
        },
        category: {
            type: [CodeableConcept],
            default: void 0
        },
        focus: {
            type: [CodeableConcept],
            default: void 0
        },
        condition: {
            type: [CodeableConcept],
            default: void 0
        },
        contact: {
            type: [ContactDetail],
            default: void 0
        },
        relatedArtifact: {
            type: [RelatedArtifact],
            default: void 0
        },
        keyword: {
            type: [CodeableConcept],
            default: void 0
        },
        location: {
            type: [CodeableConcept],
            default: void 0
        },
        description: markdown,
        enrollment: {
            type: [Reference],
            default: void 0
        },
        period: {
            type: Period,
            default: void 0
        },
        sponsor: {
            type: Reference,
            default: void 0
        },
        principalInvestigator: {
            type: Reference,
            default: void 0
        },
        site: {
            type: [Reference],
            default: void 0
        },
        reasonStopped: {
            type: CodeableConcept,
            default: void 0
        },
        note: {
            type: [Annotation],
            default: void 0
        },
        arm: {
            type: [ResearchStudy_Arm],
            default: void 0
        },
        objective: {
            type: [ResearchStudy_Objective],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "ResearchStudy"
            ]
        }
    };

    ResearchStudy.id = {
        ...id,
        index: true
    };
    ResearchStudy.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ResearchStudy;
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
    const ResearchStudySchema = new mongoose.Schema(ResearchStudy, schemaConfig);


    ResearchStudySchema.methods.getFHIRField = function() {
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

    ResearchStudySchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "ResearchStudy") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.ResearchStudy_history.findOne({
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

    ResearchStudySchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ResearchStudy/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['ResearchStudy_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ResearchStudy/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['ResearchStudy_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "ResearchStudy"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    ResearchStudySchema.pre('findOneAndUpdate', async function(next) {
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

    ResearchStudySchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ResearchStudy/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['ResearchStudy_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ResearchStudySchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in ResearchStudy resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ResearchStudy/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['ResearchStudy_history'].create(item);
        next();
    });

    ResearchStudySchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ResearchStudyModel = mongoose.model("ResearchStudy", ResearchStudySchema, "ResearchStudy");
    return ResearchStudyModel;
};