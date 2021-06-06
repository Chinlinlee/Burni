const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash')
module.exports = function() {
    let Patient = require('./Patient').schema
    Patient.id.unique = false;
    Patient.request = {
        "type": Object,
        "method": {
            type: String,
            required: true
        },
        "url": {
            type: String,
            required: true
        }
    }
    Patient.response = {
        "type": Object,
        "status": {
            type: String,
            required: true
        }
    }
    const PatientHistorySchema = new mongoose.Schema(Patient, {
        toObject: {
            getters: true
        },
        toJSON: {
            getters: true
        }
    });

    PatientHistorySchema.methods.getFHIRField = function() {
        let result = this.toObject();
        delete result._id;
        let version = result.__v;
        if (version) {
            _.set(result, 'meta.versionId', version.toString());
        }
        delete result.__v;
        delete result['name._id'];
        delete result['request'];
        delete result['response'];
        return result;
    }
    PatientHistorySchema.methods.getFHIRBundleField = function() {
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

    const PatientHistoryModel = mongoose.model("Patient_history", PatientHistorySchema, "Patient_history");
    return PatientHistoryModel;
}