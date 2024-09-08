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
module.exports = function() {
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
        return result.toObject();
    };

    AppointmentSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "Appointment") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.Appointment_history.findOne({
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

    AppointmentSchema.post('save', async function(result) {
        let mongodb = require('../index');
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
            let createdDocs = await mongodb['Appointment_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['Appointment_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "Appointment"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    AppointmentSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version + 1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    AppointmentSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['Appointment_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    AppointmentSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in Appointment resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Appointment/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['Appointment_history'].create(item);
        next();
    });

    AppointmentSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const AppointmentModel = mongoose.model("Appointment", AppointmentSchema, "Appointment");
    return AppointmentModel;
};