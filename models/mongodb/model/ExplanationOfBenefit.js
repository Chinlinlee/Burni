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
const {
    Period
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    ExplanationOfBenefit_Related
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Payee
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const string = require('../FHIRDataTypesSchema/string');
const {
    ExplanationOfBenefit_CareTeam
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_SupportingInfo
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Diagnosis
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Procedure
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    ExplanationOfBenefit_Insurance
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Accident
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Item
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_AddItem
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Adjudication
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Total
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_Payment
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_ProcessNote
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    ExplanationOfBenefit_BenefitBalance
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
    const ExplanationOfBenefit = {
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
            enum: ["active", "cancelled", "draft", "entered-in-error"],
            default: void 0
        },
        type: {
            type: CodeableConcept,
            required: true,
            default: void 0
        },
        subType: {
            type: CodeableConcept,
            default: void 0
        },
        use: code,
        patient: {
            type: Reference,
            required: true,
            default: void 0
        },
        billablePeriod: {
            type: Period,
            default: void 0
        },
        created: dateTime,
        enterer: {
            type: Reference,
            default: void 0
        },
        insurer: {
            type: Reference,
            required: true,
            default: void 0
        },
        provider: {
            type: Reference,
            required: true,
            default: void 0
        },
        priority: {
            type: CodeableConcept,
            default: void 0
        },
        fundsReserveRequested: {
            type: CodeableConcept,
            default: void 0
        },
        fundsReserve: {
            type: CodeableConcept,
            default: void 0
        },
        related: {
            type: [ExplanationOfBenefit_Related],
            default: void 0
        },
        prescription: {
            type: Reference,
            default: void 0
        },
        originalPrescription: {
            type: Reference,
            default: void 0
        },
        payee: {
            type: ExplanationOfBenefit_Payee,
            default: void 0
        },
        referral: {
            type: Reference,
            default: void 0
        },
        facility: {
            type: Reference,
            default: void 0
        },
        claim: {
            type: Reference,
            default: void 0
        },
        claimResponse: {
            type: Reference,
            default: void 0
        },
        outcome: code,
        disposition: string,
        preAuthRef: {
            type: [string],
            default: void 0
        },
        preAuthRefPeriod: {
            type: [Period],
            default: void 0
        },
        careTeam: {
            type: [ExplanationOfBenefit_CareTeam],
            default: void 0
        },
        supportingInfo: {
            type: [ExplanationOfBenefit_SupportingInfo],
            default: void 0
        },
        diagnosis: {
            type: [ExplanationOfBenefit_Diagnosis],
            default: void 0
        },
        procedure: {
            type: [ExplanationOfBenefit_Procedure],
            default: void 0
        },
        precedence: positiveInt,
        insurance: {
            type: [ExplanationOfBenefit_Insurance],
            required: true,
            default: void 0
        },
        accident: {
            type: ExplanationOfBenefit_Accident,
            default: void 0
        },
        item: {
            type: [ExplanationOfBenefit_Item],
            default: void 0
        },
        addItem: {
            type: [ExplanationOfBenefit_AddItem],
            default: void 0
        },
        adjudication: {
            type: [ExplanationOfBenefit_Adjudication],
            default: void 0
        },
        total: {
            type: [ExplanationOfBenefit_Total],
            default: void 0
        },
        payment: {
            type: ExplanationOfBenefit_Payment,
            default: void 0
        },
        formCode: {
            type: CodeableConcept,
            default: void 0
        },
        form: {
            type: Attachment,
            default: void 0
        },
        processNote: {
            type: [ExplanationOfBenefit_ProcessNote],
            default: void 0
        },
        benefitPeriod: {
            type: Period,
            default: void 0
        },
        benefitBalance: {
            type: [ExplanationOfBenefit_BenefitBalance],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "ExplanationOfBenefit"
            ]
        }
    };

    ExplanationOfBenefit.id = {
        ...id,
        index: true
    };
    ExplanationOfBenefit.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ExplanationOfBenefit;
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
    const ExplanationOfBenefitSchema = new mongoose.Schema(ExplanationOfBenefit, schemaConfig);


    ExplanationOfBenefitSchema.methods.getFHIRField = function() {
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

    ExplanationOfBenefitSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "ExplanationOfBenefit") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.ExplanationOfBenefit_history.findOne({
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

    ExplanationOfBenefitSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ExplanationOfBenefit/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['ExplanationOfBenefit_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ExplanationOfBenefit/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['ExplanationOfBenefit_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "ExplanationOfBenefit"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    ExplanationOfBenefitSchema.pre('findOneAndUpdate', async function(next) {
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

    ExplanationOfBenefitSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ExplanationOfBenefit/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['ExplanationOfBenefit_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ExplanationOfBenefitSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in ExplanationOfBenefit resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/ExplanationOfBenefit/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['ExplanationOfBenefit_history'].create(item);
        next();
    });

    ExplanationOfBenefitSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ExplanationOfBenefitModel = mongoose.model("ExplanationOfBenefit", ExplanationOfBenefitSchema, "ExplanationOfBenefit");
    return ExplanationOfBenefitModel;
};