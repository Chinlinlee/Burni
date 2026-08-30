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
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Dosage
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationRequest_DispenseRequest
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationRequest_Substitution
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
    const MedicationRequest = {
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
        intent: code,
        category: {
            type: [CodeableConcept],
            default: void 0
        },
        priority: code,
        doNotPerform: boolean,
        reportedBoolean: boolean,
        reportedReference: {
            type: Reference,
            default: void 0
        },
        medicationCodeableConcept: {
            type: CodeableConcept,
            default: void 0
        },
        medicationReference: {
            type: Reference,
            default: void 0
        },
        subject: {
            type: Reference,
            required: true,
            default: void 0
        },
        encounter: {
            type: Reference,
            default: void 0
        },
        supportingInformation: {
            type: [Reference],
            default: void 0
        },
        authoredOn: dateTime,
        requester: {
            type: Reference,
            default: void 0
        },
        performer: {
            type: Reference,
            default: void 0
        },
        performerType: {
            type: CodeableConcept,
            default: void 0
        },
        recorder: {
            type: Reference,
            default: void 0
        },
        reasonCode: {
            type: [CodeableConcept],
            default: void 0
        },
        reasonReference: {
            type: [Reference],
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
        basedOn: {
            type: [Reference],
            default: void 0
        },
        groupIdentifier: {
            type: Identifier,
            default: void 0
        },
        courseOfTherapyType: {
            type: CodeableConcept,
            default: void 0
        },
        insurance: {
            type: [Reference],
            default: void 0
        },
        note: {
            type: [Annotation],
            default: void 0
        },
        dosageInstruction: {
            type: [Dosage],
            default: void 0
        },
        dispenseRequest: {
            type: MedicationRequest_DispenseRequest,
            default: void 0
        },
        substitution: {
            type: MedicationRequest_Substitution,
            default: void 0
        },
        priorPrescription: {
            type: Reference,
            default: void 0
        },
        detectedIssue: {
            type: [Reference],
            default: void 0
        },
        eventHistory: {
            type: [Reference],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "MedicationRequest"
            ]
        }
    };

    MedicationRequest.id = {
        ...id,
        index: true
    };
    MedicationRequest.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = MedicationRequest;
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
    const MedicationRequestSchema = new mongoose.Schema(MedicationRequest, schemaConfig);


    MedicationRequestSchema.methods.getFHIRField = function() {
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

    MedicationRequestSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "MedicationRequest") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.MedicationRequest_history.findOne({
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

    MedicationRequestSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationRequest/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['MedicationRequest_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationRequest/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['MedicationRequest_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "MedicationRequest"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    MedicationRequestSchema.pre('findOneAndUpdate', async function(next) {
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

    MedicationRequestSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationRequest/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['MedicationRequest_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    MedicationRequestSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in MedicationRequest resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationRequest/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['MedicationRequest_history'].create(item);
        next();
    });

    MedicationRequestSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const MedicationRequestModel = mongoose.model("MedicationRequest", MedicationRequestSchema, "MedicationRequest");
    return MedicationRequestModel;
};