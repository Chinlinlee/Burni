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
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const {
    MedicationKnowledge_RelatedMedicationKnowledge
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_Monograph
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_Ingredient
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    MedicationKnowledge_Cost
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_MonitoringProgram
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_AdministrationGuidelines
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_MedicineClassification
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_Packaging
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_DrugCharacteristic
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_Regulatory
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    MedicationKnowledge_Kinetics
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
    const MedicationKnowledge = {
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
        code: {
            type: CodeableConcept,
            default: void 0
        },
        status: code,
        manufacturer: {
            type: Reference,
            default: void 0
        },
        doseForm: {
            type: CodeableConcept,
            default: void 0
        },
        amount: {
            type: Quantity,
            default: void 0
        },
        synonym: {
            type: [string],
            default: void 0
        },
        relatedMedicationKnowledge: {
            type: [MedicationKnowledge_RelatedMedicationKnowledge],
            default: void 0
        },
        associatedMedication: {
            type: [Reference],
            default: void 0
        },
        productType: {
            type: [CodeableConcept],
            default: void 0
        },
        monograph: {
            type: [MedicationKnowledge_Monograph],
            default: void 0
        },
        ingredient: {
            type: [MedicationKnowledge_Ingredient],
            default: void 0
        },
        preparationInstruction: markdown,
        intendedRoute: {
            type: [CodeableConcept],
            default: void 0
        },
        cost: {
            type: [MedicationKnowledge_Cost],
            default: void 0
        },
        monitoringProgram: {
            type: [MedicationKnowledge_MonitoringProgram],
            default: void 0
        },
        administrationGuidelines: {
            type: [MedicationKnowledge_AdministrationGuidelines],
            default: void 0
        },
        medicineClassification: {
            type: [MedicationKnowledge_MedicineClassification],
            default: void 0
        },
        packaging: {
            type: MedicationKnowledge_Packaging,
            default: void 0
        },
        drugCharacteristic: {
            type: [MedicationKnowledge_DrugCharacteristic],
            default: void 0
        },
        contraindication: {
            type: [Reference],
            default: void 0
        },
        regulatory: {
            type: [MedicationKnowledge_Regulatory],
            default: void 0
        },
        kinetics: {
            type: [MedicationKnowledge_Kinetics],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "MedicationKnowledge"
            ]
        }
    };

    MedicationKnowledge.id = {
        ...id,
        index: true
    };
    MedicationKnowledge.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = MedicationKnowledge;
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
    const MedicationKnowledgeSchema = new mongoose.Schema(MedicationKnowledge, schemaConfig);


    MedicationKnowledgeSchema.methods.getFHIRField = function() {
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

    MedicationKnowledgeSchema.pre('save', async function(next) {
        const mongodb = modelConnection;
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.model("FHIRStoredID").findOne({
                id: this.id
            });
            if (storedID.resourceType != "MedicationKnowledge") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.model("MedicationKnowledge_history").findOne({
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

    MedicationKnowledgeSchema.post('save', async function(result) {
        const mongodb = modelConnection;
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationKnowledge/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb.model("MedicationKnowledge_history").create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationKnowledge/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb.model("MedicationKnowledge_history").create(item);
        }
        await mongodb.model("FHIRStoredID").findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "MedicationKnowledge"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item, modelConnection);
    });

    MedicationKnowledgeSchema.pre('findOneAndUpdate', async function(next) {
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

    MedicationKnowledgeSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationKnowledge/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await modelConnection.model("MedicationKnowledge_history").create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item, modelConnection);

        return result;
    });

    MedicationKnowledgeSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in MedicationKnowledge resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/MedicationKnowledge/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await modelConnection.model("MedicationKnowledge_history").create(item);
        next();
    });

    MedicationKnowledgeSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource, modelConnection);
        await deleteEmptyRefBy(modelConnection);
    });

    const MedicationKnowledgeModel = modelConnection.model("MedicationKnowledge", MedicationKnowledgeSchema, "MedicationKnowledge");
    return MedicationKnowledgeModel;
};