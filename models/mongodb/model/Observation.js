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
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const instant = require('../FHIRDataTypesSchema/instant');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Ratio
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    SampledData
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const time = require('../FHIRDataTypesSchema/time');
const {
    Annotation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Observation_ReferenceRange
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Observation_Component
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const id = require('../FHIRDataTypesSchema/id');
const {
    storeResourceRefBy,
    updateRefBy,
    deleteEmptyRefBy,
    checkResourceHaveReferenceByOthers
} = require("../common");
module.exports = function() {
    const Observation = {
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
        basedOn: {
            type: [Reference],
            default: void 0
        },
        partOf: {
            type: [Reference],
            default: void 0
        },
        status: {
            type: String,
            enum: ["registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error", "unknown"],
            default: void 0
        },
        category: {
            type: [CodeableConcept],
            default: void 0
        },
        code: {
            type: CodeableConcept,
            required: true,
            default: void 0
        },
        subject: {
            type: Reference,
            default: void 0
        },
        focus: {
            type: [Reference],
            default: void 0
        },
        encounter: {
            type: Reference,
            default: void 0
        },
        effectiveDateTime: dateTime,
        effectivePeriod: {
            type: Period,
            default: void 0
        },
        effectiveTiming: {
            type: Timing,
            default: void 0
        },
        effectiveInstant: instant,
        issued: instant,
        performer: {
            type: [Reference],
            default: void 0
        },
        valueQuantity: {
            type: Quantity,
            default: void 0
        },
        valueCodeableConcept: {
            type: CodeableConcept,
            default: void 0
        },
        valueString: string,
        valueBoolean: boolean,
        valueInteger: {
            type: Number,
            default: void 0
        },
        valueRange: {
            type: Range,
            default: void 0
        },
        valueRatio: {
            type: Ratio,
            default: void 0
        },
        valueSampledData: {
            type: SampledData,
            default: void 0
        },
        valueTime: time,
        valueDateTime: dateTime,
        valuePeriod: {
            type: Period,
            default: void 0
        },
        dataAbsentReason: {
            type: CodeableConcept,
            default: void 0
        },
        interpretation: {
            type: [CodeableConcept],
            default: void 0
        },
        note: {
            type: [Annotation],
            default: void 0
        },
        bodySite: {
            type: CodeableConcept,
            default: void 0
        },
        method: {
            type: CodeableConcept,
            default: void 0
        },
        specimen: {
            type: Reference,
            default: void 0
        },
        device: {
            type: Reference,
            default: void 0
        },
        referenceRange: {
            type: [Observation_ReferenceRange],
            default: void 0
        },
        hasMember: {
            type: [Reference],
            default: void 0
        },
        derivedFrom: {
            type: [Reference],
            default: void 0
        },
        component: {
            type: [Observation_Component],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "Observation"
            ]
        }
    };

    Observation.id = {
        ...id,
        index: true
    };
    Observation.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = Observation;
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
    const ObservationSchema = new mongoose.Schema(Observation, schemaConfig);


    ObservationSchema.methods.getFHIRField = function() {
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

    ObservationSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "Observation") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.Observation_history.findOne({
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

    ObservationSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Observation/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['Observation_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Observation/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['Observation_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "Observation"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    ObservationSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version + 1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    ObservationSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Observation/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['Observation_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ObservationSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in Observation resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/Observation/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['Observation_history'].create(item);
        next();
    });

    ObservationSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ObservationModel = mongoose.model("Observation", ObservationSchema, "Observation");
    return ObservationModel;
};