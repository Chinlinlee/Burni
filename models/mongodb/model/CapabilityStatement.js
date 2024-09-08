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
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    ContactDetail
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    UsageContext
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    CapabilityStatement_Software
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CapabilityStatement_Implementation
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CapabilityStatement_Rest
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CapabilityStatement_Messaging
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const {
    CapabilityStatement_Document
} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');
const id = require('../FHIRDataTypesSchema/id');
const {
    storeResourceRefBy,
    updateRefBy,
    deleteEmptyRefBy,
    checkResourceHaveReferenceByOthers
} = require("../common");
module.exports = function() {
    const CapabilityStatement = {
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
        url: uri,
        version: string,
        name: string,
        title: string,
        status: {
            type: String,
            enum: ["draft", "active", "retired", "unknown"],
            default: void 0
        },
        experimental: boolean,
        date: dateTime,
        publisher: string,
        contact: {
            type: [ContactDetail],
            default: void 0
        },
        description: markdown,
        useContext: {
            type: [UsageContext],
            default: void 0
        },
        jurisdiction: {
            type: [CodeableConcept],
            default: void 0
        },
        purpose: markdown,
        copyright: markdown,
        kind: {
            type: String,
            enum: ["instance", "capability", "requirements"],
            default: void 0
        },
        instantiates: {
            type: [canonical],
            default: void 0
        },
        imports: {
            type: [canonical],
            default: void 0
        },
        software: {
            type: CapabilityStatement_Software,
            default: void 0
        },
        implementation: {
            type: CapabilityStatement_Implementation,
            default: void 0
        },
        fhirVersion: {
            type: String,
            enum: ["0.01", "0.05", "0.06", "0.11", "0.0.80", "0.0.81", "0.0.82", "0.4.0", "0.5.0", "1.0.0", "1.0.1", "1.0.2", "1.1.0", "1.4.0", "1.6.0", "1.8.0", "3.0.0", "3.0.1", "3.3.0", "3.5.0", "4.0.0", "4.0.1"],
            default: void 0
        },
        format: {
            type: [code],
            default: void 0
        },
        patchFormat: {
            type: [code],
            default: void 0
        },
        implementationGuide: {
            type: [canonical],
            default: void 0
        },
        rest: {
            type: [CapabilityStatement_Rest],
            default: void 0
        },
        messaging: {
            type: [CapabilityStatement_Messaging],
            default: void 0
        },
        document: {
            type: [CapabilityStatement_Document],
            default: void 0
        },
        resourceType: {
            type: String,
            required: true,
            enum: [
                "CapabilityStatement"
            ]
        }
    };

    CapabilityStatement.id = {
        ...id,
        index: true
    };
    CapabilityStatement.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = CapabilityStatement;
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
    const CapabilityStatementSchema = new mongoose.Schema(CapabilityStatement, schemaConfig);


    CapabilityStatementSchema.methods.getFHIRField = function() {
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

    CapabilityStatementSchema.pre('save', async function(next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID == "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType != "CapabilityStatement") {
                console.error('err', storedID);
                return next(new Error(`The id->${this.id} stored by resource ${storedID.resourceType}`));
            }
        }

        const docInHistory = await mongodb.CapabilityStatement_history.findOne({
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

    CapabilityStatementSchema.post('save', async function(result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : `:${process.env.FHIRSERVER_PORT}`;
        if (version == "1") {
            _.set(item, "request", {
                "method": "POST",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/CapabilityStatement/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['CapabilityStatement_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/CapabilityStatement/${item.id}/_history/${version}`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['CapabilityStatement_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id: result.id
        }, {
            id: result.id,
            resourceType: "CapabilityStatement"
        }, {
            upsert: true
        });

        await storeResourceRefBy(item);
    });

    CapabilityStatementSchema.pre('findOneAndUpdate', async function(next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version + 1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    CapabilityStatementSchema.post('findOneAndUpdate', async function(result) {
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/CapabilityStatement/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['CapabilityStatement_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    CapabilityStatementSchema.pre('findOneAndDelete', async function(next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(`The id->${this.getFilter().id} not found in CapabilityStatement resource`);
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
            url: `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/CapabilityStatement/${item.id}/_history/${version}`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['CapabilityStatement_history'].create(item);
        next();
    });

    CapabilityStatementSchema.post('findOneAndDelete', async function(resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const CapabilityStatementModel = mongoose.model("CapabilityStatement", CapabilityStatementSchema, "CapabilityStatement");
    return CapabilityStatementModel;
};