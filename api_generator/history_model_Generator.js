const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').js_beautify;
const FHIRResourceList = require('../FHIR-mongoose-Models-Generator/fhir.schema.json').definitions.ResourceList.oneOf.map(v => {
    let refSplit = v.$ref.split("/");
    return refSplit[refSplit.length - 1];
});

function genHistoryModel() {
    let FHIRModelFolder = fs.readdirSync('./models/mongodb/model');
    for (let item of FHIRModelFolder) {
        if (!item.includes('_history')) {
            let fileBaseName = path.parse(item).name;
            if (!FHIRResourceList.includes(fileBaseName)) {
                continue;
            }
            let historyModel = `
           const mongoose = require('mongoose');
           const moment = require('moment');
           const _ = require('lodash');
           module.exports = function() {
               let ${fileBaseName} = require('./${fileBaseName}').schema;
               ${fileBaseName}.id.unique = false;
               ${fileBaseName}.request = {
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
               ${fileBaseName}.response = {
                    "type" : Object , 
                    "status" : {
                        type : String , 
                        required : true
                    } 
                };
                let schemaConfig = {
                    toObject : { getters : true},
                    toJSON : { getters : true}
                };
                if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
                    schemaConfig["shardKey"] = {
                        id: 1
                    };
                }
                const ${fileBaseName}HistorySchema = new mongoose.Schema(${fileBaseName}, schemaConfig);
                ${fileBaseName}HistorySchema.methods.getFHIRField = function() {
                   let result = this.toObject();
                   delete result._id;
                   delete result.__v;
                   delete result['name._id'];
                   delete result['request'];
                   delete result['response'];
                   return result;
                };
                ${fileBaseName}HistorySchema.methods.getFHIRBundleField = function() {
                   let result = this.toObject();
                   delete result._id;
                   delete result.__v;
                   delete result['name._id'];
                   return result;
                };
                
                const ${fileBaseName}HistoryModel = mongoose.model("${fileBaseName}_history", ${fileBaseName}HistorySchema, "${fileBaseName}_history");
                return ${fileBaseName}HistoryModel;
            };`;
            fs.writeFileSync(`./models/mongodb/model/${fileBaseName}_history.js`, beautify(historyModel));
        }
    }
}

module.exports.genHistoryModel = genHistoryModel;