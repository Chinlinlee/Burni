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
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');
const string = require('../FHIRDataTypesSchema/string');
const instant = require('../FHIRDataTypesSchema/instant');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Appointment_Participant
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Period
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
    const Appointment = {
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
        status: {
            type: String,
            enum: ["proposed", "pending", "booked", "arrived", "fulfilled", "cancelled", "noshow", "entered-in-error", "checked-in", "waitlist"],
            default: void 0
        },
        cancelationReason: {
            type: CodeableConcept,
            default: void 0
        },
        serviceCategory: {
            type: [CodeableConcept],
            default: void 0
        },
        serviceType: {
            type: [CodeableConcept],
            default: void 0
        },
        specialty: {
            type: [CodeableConcept],
            default: void 0
        },
        appointmentType: {
            type: CodeableConcept,
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
        priority: unsignedInt,
        description: string,
        supportingInformation: {
            type: [Reference],
            default: void 0
        },
        start: instant,
        end: instant,
        minutesDuration: positiveInt,
        slot: {
            type: [Reference],
            default: void 0
        },
        created: dateTime,
        comment: string,
        patientInstruction: string,
        basedOn: {
            type: [Reference],
            default: void 0
        },
        participant: {
            type: [Appointment_Participant],
            required: true,
            default: void 0
        },
        requestedPeriod: {
            type: [Period],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "Appointment"
            ]
        }
    };

    Appointment.id = {
        ...id,
        index: true
    };
    Appointment.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = Appointment;
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
    const AppointmentSchema = new mongoose.Schema(Appointment, schemaConfig);


    AppointmentSchema.methods.getFHIRField = function() {
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

    AppointmentSchema.pre('save', async function(next) {
        const mongodb = modelConnection;
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.model("FHIRStoredID").findOne({
                id: this.id
            });
            if (storedID.resourceType != "Appointment") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.model("Appointment_history").findOne({
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

    AppointmentSchema.post('save', async function(result) {
        const mongodb = modelConnection;
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb.model("Appointment_history").create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb.model("Appointment_history").create(item);
        }
        await mongodb.model("FHIRStoredID").findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "Appointment"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item, modelConnection);
    });

    AppointmentSchema.pre('findOneAndUpdate', async function(next) {
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

    AppointmentSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await modelConnection.model("Appointment_history").create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item, modelConnection);

        return result;
    });

    AppointmentSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in Appointment resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await modelConnection.model("Appointment_history").create(item);
        next();
    });

    AppointmentSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource, modelConnection);
        await deleteEmptyRefBy(modelConnection);
    });

    const AppointmentModel = modelConnection.model("Appointment", AppointmentSchema, "Appointment");
    return AppointmentModel;
};