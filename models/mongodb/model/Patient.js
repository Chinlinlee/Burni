const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const Meta = require('../FHIRDataTypesSchema/Meta');
const uri = require('../FHIRDataTypesSchema/uri');
const code = require('../FHIRDataTypesSchema/code');
const Narrative = require('../FHIRDataTypesSchema/Narrative');
const Extension = require('../FHIRDataTypesSchema/Extension');
const Identifier = require('../FHIRDataTypesSchema/Identifier');
const boolean = require('../FHIRDataTypesSchema/boolean');
const HumanName = require('../FHIRDataTypesSchema/HumanName');
const ContactPoint = require('../FHIRDataTypesSchema/ContactPoint');
const date = require('../FHIRDataTypesSchema/date');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const Address = require('../FHIRDataTypesSchema/Address');
const CodeableConcept = require('../FHIRDataTypesSchema/CodeableConcept');
const Attachment = require('../FHIRDataTypesSchema/Attachment');
const Patient_Contact = require('../FHIRDataTypesSchema/Patient_Contact');
const Patient_Communication = require('../FHIRDataTypesSchema/Patient_Communication');
const Reference = require('../FHIRDataTypesSchema/Reference');
const Patient_Link = require('../FHIRDataTypesSchema/Patient_Link');
const id = require('../FHIRDataTypesSchema/id');
module.exports = function() {
    require('mongoose-schema-jsonschema')(mongoose);
    const Patient = {
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
        gender: {
            type: String,
            enum: ["male", "female", "other", "unknown"],
            default: void 0
        },
        birthDate: date,
        deceasedBoolean: boolean,
        deceasedDateTime: dateTime,
        address: {
            type: [Address],
            default: void 0
        },
        maritalStatus: {
            type: CodeableConcept,
            default: void 0
        },
        multipleBirthBoolean: boolean,
        multipleBirthInteger: {
            type: Number,
            default: void 0
        },
        photo: {
            type: [Attachment],
            default: void 0
        },
        contact: {
            type: [Patient_Contact],
            default: void 0
        },
        communication: {
            type: [Patient_Communication],
            default: void 0
        },
        generalPractitioner: {
            type: [Reference],
            default: void 0
        },
        managingOrganization: {
            type: Reference,
            default: void 0
        },
        link: {
            type: [Patient_Link],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "Patient"
            ]
        }
    };

    Patient.id = {
        ...id,
        index: true
    }
    Patient.contained = {
        type: [Object],
        default: void 0
    }
    module.exports.schema = Patient;
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
    const PatientSchema = new mongoose.Schema(Patient, schemaConfig);


    PatientSchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        delete result.__v;
        if (_.get(result, "myCollection")) {
            let tempCollectionField = _.cloneDeep(result["myCollection"]);
            _.set(result, "collection", tempCollectionField);
        }
        return result;
    }

    PatientSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        let storedID = await mongodb.FHIRStoredID.findOne({
            id: this.id
        });
        if (storedID && process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            if (storedID.resourceType == "Patient") {
                const docInHistory = await mongodb.Patient_history.findOne({
                        id: this.id
                    })
                    .sort({
                        "meta.versionId": -1
                    });
                let versionId = Number(_.get(docInHistory, "meta.versionId")) + 1;
                let versionIdStr = String(versionId);
                _.set(this, "meta.versionId", versionIdStr);
                _.set(this, "meta.lastUpdated", new Date());
            } else {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        } else {
            _.set(this, "meta.versionId", "1");
            _.set(this, "meta.lastUpdated", new Date());
        }
        return next();
    });

    PatientSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Patient/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['Patient_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Patient/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['Patient_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "Patient"
        }, {
            upsert: true
        });
    });

    PatientSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version + 1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    PatientSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Patient/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['Patient_history'].create(item);
        } catch (e) {
            console.error(e);
        }
        return result;
    });

    PatientSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in Patient resource`);
        }
        let mongodb = require('../index');
        let item = docToDelete.toObject();
        delete item._id;
        item.meta.versionId = String(Number(item.meta.versionId) + 1);
        let version = item.meta.versionId;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        _.set(item, "request", {
            "method": "DELETE",
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Patient/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['Patient_history'].create(item);
        next();
    });

    const PatientModel = mongoose.model("Patient", PatientSchema, "Patient");
    return PatientModel;
}