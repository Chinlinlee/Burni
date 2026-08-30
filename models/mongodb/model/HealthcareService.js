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
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ContactPoint
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    HealthcareService_Eligibility
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    HealthcareService_AvailableTime
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    HealthcareService_NotAvailable
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
    const HealthcareService = {
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
        providedBy: {
            type: Reference,
            default: void 0
        },
        category: {
            type: [CodeableConcept],
            default: void 0
        },
        type: {
            type: [CodeableConcept],
            default: void 0
        },
        specialty: {
            type: [CodeableConcept],
            default: void 0
        },
        location: {
            type: [Reference],
            default: void 0
        },
        name: string,
        comment: string,
        extraDetails: markdown,
        photo: {
            type: Attachment,
            default: void 0
        },
        telecom: {
            type: [ContactPoint],
            default: void 0
        },
        coverageArea: {
            type: [Reference],
            default: void 0
        },
        serviceProvisionCode: {
            type: [CodeableConcept],
            default: void 0
        },
        eligibility: {
            type: [HealthcareService_Eligibility],
            default: void 0
        },
        program: {
            type: [CodeableConcept],
            default: void 0
        },
        characteristic: {
            type: [CodeableConcept],
            default: void 0
        },
        communication: {
            type: [CodeableConcept],
            default: void 0
        },
        referralMethod: {
            type: [CodeableConcept],
            default: void 0
        },
        appointmentRequired: boolean,
        availableTime: {
            type: [HealthcareService_AvailableTime],
            default: void 0
        },
        notAvailable: {
            type: [HealthcareService_NotAvailable],
            default: void 0
        },
        availabilityExceptions: string,
        endpoint: {
            type: [Reference],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "HealthcareService"
            ]
        }
    };

    HealthcareService.id = {
        ...id,
        index: true
    };
    HealthcareService.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = HealthcareService;
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
    const HealthcareServiceSchema = new mongoose.Schema(HealthcareService, schemaConfig);


    HealthcareServiceSchema.methods.getFHIRField = function() {
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

    HealthcareServiceSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "HealthcareService") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.HealthcareService_history.findOne({
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

    HealthcareServiceSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/HealthcareService/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['HealthcareService_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/HealthcareService/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['HealthcareService_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "HealthcareService"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    HealthcareServiceSchema.pre('findOneAndUpdate', async function(next) {
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

    HealthcareServiceSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/HealthcareService/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['HealthcareService_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    HealthcareServiceSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in HealthcareService resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/HealthcareService/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['HealthcareService_history'].create(item);
        next();
    });

    HealthcareServiceSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const HealthcareServiceModel = mongoose.model("HealthcareService", HealthcareServiceSchema, "HealthcareService");
    return HealthcareServiceModel;
};