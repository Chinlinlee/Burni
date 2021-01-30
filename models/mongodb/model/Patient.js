const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');
const Identifier = require('../FHIRTypeSchema/Identifier');
const HumanName = require('../FHIRTypeSchema/HumanName');
const ContactPoint = require('../FHIRTypeSchema/ContactPoint');
const Address = require('../FHIRTypeSchema/Address');
const CodeableConcept = require('../FHIRTypeSchema/CodeableConcept');
const Attachment = require('../FHIRTypeSchema/Attachment');
const Patient_Contact = require('../FHIRTypeSchema/Patient_Contact');
const Patient_Communication = require('../FHIRTypeSchema/Patient_Communication');
const Reference = require('../FHIRTypeSchema/Reference');
const Patient_Link = require('../FHIRTypeSchema/Patient_Link');
module.exports = function() {
    const Patient = {
        id: {
            type: String,
            unique: true,
            index: true
        },
        resourceType: {
            type: String,
            required: true
        },
        identifier: {
            type: [Identifier],
            default: void 0
        },
        active: {
            type: Boolean,
            default: void 0
        },
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
        birthDate: {
            type: Date,
            get: function(v) {
                return moment(v).format('YYYY-MM-DD');
            },
            default: void 0
        },
        deceasedBoolean: {
            type: Boolean,
            default: void 0
        },
        deceasedDateTime: {
            type: String,
            default: void 0
        },
        address: {
            type: [Address],
            default: void 0
        },
        maritalStatus: {
            type: CodeableConcept,
            default: void 0
        },
        multipleBirthBoolean: {
            type: Boolean,
            default: void 0
        },
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
        }
    };

    module.exports.schema = Patient;
    const PatientSchema = new mongoose.Schema(Patient, {
        toObject: {
            getters: true
        },
        toJSON: {
            getters: true
        }
    });

    PatientSchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        let version = result.__v;
        if (version) {
            _.set(result, 'meta.versionId', version.toString());
        }
        delete result.__v;
        delete result['name._id'];
        return result;
    }
    PatientSchema.post('findOneAndUpdate', async function(result) {
        if (result.value) {
            result.value.__v++;
            await result.value.save();
        } else {
            result.__v++;
            await result.save();
        }
        return result;
    })
    PatientSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let mongodb = require('../index');
        let item = docToUpdate.toObject();
        delete item._id;
        //item.id = uuid.v4();
        let version = item.__v;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == 1) {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Patient/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Patient/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
        }
        let createdDocs = await mongodb['Patient_history'].create(item);
        await mongodb.Patient_history.findOneAndUpdate({
            _id: mongoose.Types.ObjectId(createdDocs._id)
        }, {
            $set: {
                __v: version
            }
        });
        next();
    });
    const PatientModel = mongoose.model("Patient", PatientSchema, "Patient");
    return PatientModel;
}