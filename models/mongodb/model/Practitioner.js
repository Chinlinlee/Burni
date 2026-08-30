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
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    HumanName
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ContactPoint
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Address
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const date = require('../FHIRDataTypesSchema/date');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Practitioner_Qualification
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
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
    const Practitioner = {
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
        active: boolean,
        name: {
            type: [HumanName],
            default: void 0
        },
        telecom: {
            type: [ContactPoint],
            default: void 0
        },
        address: {
            type: [Address],
            default: void 0
        },
        gender: {
            type: String,
            enum: ["male", "female", "other", "unknown"],
            default: void 0
        },
        birthDate: date,
        photo: {
            type: [Attachment],
            default: void 0
        },
        qualification: {
            type: [Practitioner_Qualification],
            default: void 0
        },
        communication: {
            type: [CodeableConcept],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "Practitioner"
            ]
        }
    };

    Practitioner.id = {
        ...id,
        index: true
    };
    Practitioner.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = Practitioner;
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
    const PractitionerSchema = new mongoose.Schema(Practitioner, schemaConfig);


    PractitionerSchema.methods.getFHIRField = function() {
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

    PractitionerSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "Practitioner") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.Practitioner_history.findOne({
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

    PractitionerSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Practitioner/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['Practitioner_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Practitioner/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['Practitioner_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "Practitioner"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    PractitionerSchema.pre('findOneAndUpdate', async function(next) {
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

    PractitionerSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Practitioner/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['Practitioner_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    PractitionerSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in Practitioner resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Practitioner/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['Practitioner_history'].create(item);
        next();
    });

    PractitionerSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const PractitionerModel = mongoose.model("Practitioner", PractitionerSchema, "Practitioner");
    return PractitionerModel;
};