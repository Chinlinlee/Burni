const fs = require("fs");
const path = require("path");
const beautify = require("js-beautify").js_beautify;
const FHIRResourceList =
    require("../FHIR-mongoose-Models-Generator/fhir.schema.json").definitions.ResourceList.oneOf.map(
        (v) => {
            let refSplit = v.$ref.split("/");
            return refSplit[refSplit.length - 1];
        }
    );

function getHistoryProvenanceSchemaFields(fileBaseName) {
    return `
               ${fileBaseName}.bundleRequest = {
                   "type" : Object ,
                   "method" : {
                       type : String ,
                       required : true
                   } ,
                   "url" : {
                       type: String ,
                       required : true
                   }
               };
               ${fileBaseName}.bundleResponse = {
                    "type" : Object ,
                    "status" : {
                        type : String ,
                        required : true
                    }
                };`;
}

function genHistoryModel() {
    let FHIRModelFolder = fs.readdirSync("./models/mongodb/model");
    for (let item of FHIRModelFolder) {
        if (!item.includes("_history")) {
            let fileBaseName = path.parse(item).name;
            if (!FHIRResourceList.includes(fileBaseName)) {
                continue;
            }
            let historyModel = `
           const mongoose = require('mongoose');
           const moment = require('moment');
           const _ = require('lodash');
           const { serializeResourceTemporals } = require("../../FHIR/temporal");
           const { stripHistoryProvenanceForVread } = require("../historyProvenance");
           module.exports = function(connection = mongoose) {
               const modelConnection = connection;
               const schemaConstructor = modelConnection.base?.Schema || mongoose.Schema;
               let ${fileBaseName} = require('./${fileBaseName}').schema;
               ${fileBaseName}.id.unique = false;
               ${getHistoryProvenanceSchemaFields(fileBaseName)}
                let schemaConfig = {
                    toObject : { getters : true},
                    toJSON : { getters : true}
                };
                if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
                    schemaConfig["shardKey"] = {
                        id: 1
                    };
                }
               const ${fileBaseName}HistorySchema = new schemaConstructor(${fileBaseName}, schemaConfig);
                ${fileBaseName}HistorySchema.methods.getFHIRField = function() {
                   let result = this.toObject();
                   return serializeResourceTemporals(stripHistoryProvenanceForVread(result));
                };
                ${fileBaseName}HistorySchema.methods.getFHIRBundleField = function() {
                   let result = this.toObject();
                   delete result._id;
                   delete result.__v;
                   delete result['name._id'];
                   return serializeResourceTemporals(result);
                };
                
               const ${fileBaseName}HistoryModel = modelConnection.model("${fileBaseName}_history", ${fileBaseName}HistorySchema, "${fileBaseName}_history");
                return ${fileBaseName}HistoryModel;
            };`;
            fs.writeFileSync(
                `./models/mongodb/model/${fileBaseName}_history.js`,
                beautify(historyModel)
            );
        }
    }
}

module.exports.genHistoryModel = genHistoryModel;
