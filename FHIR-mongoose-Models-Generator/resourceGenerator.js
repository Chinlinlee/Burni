const fs =require('fs');
const _ = require('lodash');
const beautify = require('js-beautify').js;
const primitiveType = ["Boolean"  , "String" , "Date" , "Number" , "Buffer"];
const skipFieldTypes = ["Number" , "String" , "Date" , "this" , "Object"];
const path = require('path');
const mkdirp = require('mkdirp');
const DataTypesSummary = require("./DataTypesSummary");
let schemaJson = JSON.parse(fs.readFileSync(path.join(__dirname ,'./fhir.schema.json') , {encoding: 'utf-8'}));
let FHIRJson = schemaJson.definitions;
let config = {};

function checkHaveSchema(typeName) {
    return fs.existsSync(`./models/mongodb/FHIRDataTypesSchema/${typeName}.js`);
}

function isFHIRSchema(typeName) {
    return !_.isUndefined(_.get(FHIRJson ,typeName)) ;
}

function isPrimitiveType(typeName) {
    return /^[a-z]/.test(typeName) && typeName != "number" && DataTypesSummary.PrimitiveTypes.includes(typeName);
}


function cleanChildSchema (item) {
    for (let i in item) {
        if (_.get(item[i] , "type")){
            let isArray = /[\[\]]/gm.test(item[i].type);
            let type = item[i].type.replace(/[\[\]]/gm,'');
            if (type == "number") {
                item[i].type = isArray ? "[Number]" : "Number";
            } else if (type == "ResourceList") { //todo, the resourceList need all resource, maybe just generate minium resourceList dynamic?
                item[i].type = "Object";
            }
        }
    }
}

function fixChoiceTypeOfDate (fieldName, type) {
    if (fieldName == "modifierExtension") return {
        yes: false,
        type: ""
    };
    const dateTypes = ["Date", "DateTime", "Instant", "Time"];
    let typeOfField = fieldName.match(/([A-Z])\w+/g);
    
    for (let i = 0 ; i < dateTypes.length ; i++) {
        let dateType = dateTypes[i];
        
        if (typeOfField == dateType && type == "string") { 
            console.info(`fieldName ${fieldName} typeOfField ${typeOfField} , dateType ${dateType} , type ${type}`);
            let lowerFirstDateTypes = dateType.charAt(0).toLowerCase() + dateType.slice(1);
            return {
                yes: true,
                type: lowerFirstDateTypes
            };
        }
    }
    return {
        yes: false,
        type: ""
    };
}

/**
 * Parse fhir.schema (JSON Standard Schema) to Mongoose Schema
 * @param {*} resource 
 * @param {*} name 
 * @returns 
 */
function getSchema (resource , name) {
    //let skipCol = ["resourceType" , "id" , "meta" ,"implicitRules" ,"language" , "text" ,"contained" , "extension" , "modifierExtension"];
    let skipCol = ["id" , "resourceType" , "contained"];
    let result = {};
    
    for (let i in resource.properties) {
        //skip the unusual type
        if (skipCol.indexOf(i) >= 0 ) continue;
        else if (i.indexOf("_") == 0 ) continue;
        let type = _.get(resource.properties[i] , "type");
        let choiceTypeDate = fixChoiceTypeOfDate(i, type);
        let refSchema = _.get(resource.properties[i] , "$ref");
        let isCode = _.get(resource.properties[i] , "enum");
        if (type == 'array') {
            let arrayRef = resource.properties[i].items.$ref;
            if (resource.properties[i].items.enum) {
                result[i] = {
                    type : `[String]` 
                };
                continue;
            }
            let arrayRefClean  = arrayRef.split('/');
            let typeOfField = arrayRefClean[arrayRefClean.length-1];
            if (typeOfField == name) typeOfField = "this"; //The type of field reference self
            if (choiceTypeDate.yes) typeOfField = choiceTypeDate.type;
            result[i] = {
                type : `[${typeOfField}]` 
            };
        } else if (refSchema)  {
            if (/^#/.test(refSchema)) {
                let refClean = refSchema.split('/');
                let typeOfField = refClean[refClean.length-1];
                if (choiceTypeDate.yes) typeOfField = choiceTypeDate.type;
                if (isPrimitiveType(typeOfField)) {
                    result[i] = typeOfField;
                } else {
                    result[i] = {
                        type : typeOfField
                    };
                }
                
            } else if (!/^#/.test(refSchema)) {
                let refClean = refSchema.split('/');
                let typeOfField = refClean[refClean.length-1];
                if (choiceTypeDate.yes) typeOfField = choiceTypeDate.type;
                if (isPrimitiveType(typeOfField)) {
                    result[i] = typeOfField;
                } else {
                    result[i] = {
                        type : typeOfField 
                    };
                }
            }
        } else if (isCode) {
            let typeOfField = "String";
            //console.log(type);
            result[i] = {
                type : typeOfField ,
                enum : JSON.stringify(isCode)
            };
        } else {
            if (choiceTypeDate.yes) type = choiceTypeDate.type;
            if (isPrimitiveType(type)) {
                result[i] = type;
            } else {
                result[i] = {
                    type : type 
                };
            }
        }
        let isRequired = _.get(resource , "required");
        if (isRequired) {
            for (let item of isRequired) {
                if (item == i) {
                    Object.assign(result[i] , {required : true});
                }
            }
        }
    }
    return result;
}

function getImportLibs(schema) {
    let importLib = "const mongoose = require('mongoose');\r\n";
    let importedTypeLib = [];
    let cleanType = "";
    for (let i in schema) {
        let item = schema[i];
        if (_.get(item , "type")) {
            item.default = "void 0";
            cleanType = item.type.replace(/[\[\]]/gm , '');
        } else {
            cleanType = item.replace(/[\[\]]/gm , '');
        }
        if (skipFieldTypes.indexOf(cleanType) < 0 && !importedTypeLib.includes(cleanType)) {
            if (isPrimitiveType(cleanType)) {
                importLib =`${importLib}const ${cleanType} = require('../FHIRDataTypesSchema/${cleanType}');\r\n`;
            } else {
                importLib =`${importLib}const {${cleanType}} = require('../FHIRDataTypesSchemaExport/FHIRDataTypesSchemaExport');\r\n`;
            }
            importedTypeLib.push(cleanType);
        }
    }
    return importLib;
}

function generateBackBoneElement(item) {
    let isBackBone = true;
    for (let key in DataTypesSummary) {
        if (DataTypesSummary[key].includes(item)) {
            isBackBone = false;
            break;
        }
    }
    if (isBackBone && item.includes("_")) {
        console.log("back bone element type:" , item);
        generateSchema(item);
    }
}
async function generateSchema (type) {
    let schema = getSchema(FHIRJson[type] , type);
    cleanChildSchema(schema);
    let importLibs = getImportLibs(schema);
    let schemaStr = JSON.stringify(schema , null , 4).replace(/\"/gm , '');
    let code = `module.exports = new mongoose.Schema (${schemaStr.replace(/\\/gm , '"')} , { 
        _id : false ,
        id: false,
        toObject: {
            getters: true
        }
    });`;
    code = `${importLibs}${code}`;
    fs.writeFileSync(`./models/mongodb/FHIRDataTypesSchema/${type}.js` , beautify(code , {indent_size : 4 ,pace_in_empty_paren: true }));
    // for (let i in schema) {
    //     try {
    //         let item = schema[i];
    //         if (_.get(item , "type")) { 
    //             for (let key in item) {
    //                 let deepItem = _.get(item[key] , "type") || item[key];
    //                 deepItem = String(deepItem)
    //                 deepItem = deepItem.replace(/[\[\]]/gm , '');
    //                 if (!checkHaveSchema(deepItem) && isFHIRSchema(deepItem)) {
    //                     generateBackBoneElement(deepItem);
    //                 }
    //             }
    //         }
    //     } catch (e) {
    //         console.error(e)
    //     }
    // }
}
function generateResourceSchema (type) {
    if (!FHIRJson[type]) {
        console.error('Unknown resource type ' + type);
        process.exit(1);
    }
    let result = getSchema(FHIRJson[type]);
    for (let i in result) {
        if (_.get(result[i] , "type")) {
            // let cleanType = result[i].type.replace(/[\[\]]/gm , '');
            // generateBackBoneElement(cleanType);
            result[i].default = "void 0";
        }
    }
    cleanChildSchema(result);
    let topLevelObj = {
        resourceType : {
            type : "String" ,
            required : "true" ,
            enum: [
                `"${type}"`
            ]
        }
    };
    result = Object.assign({} , result , topLevelObj);

    if (_.get(result, "collection")) {
        let tempCollectionField = _.cloneDeep(result["collection"]);
        delete result["collection"];
        _.set(result, "myCollection", tempCollectionField);
    }

    // let importLib = "const mongoose = require('mongoose');\r\nconst moment = require('moment');\r\nconst _ = require('lodash');\r\n";
    let code = `module.exports = function () {
    require('mongoose-schema-jsonschema')(mongoose);
    const ${type} = ${JSON.stringify(result , null , 4).replace(/\"/gm , '').replace(/\\/gm , '"')};\r\n
    ${type}.id = {
        ...id ,
        index: true
    };
    ${type}.contained = {
        type: [Object],
        default: void 0
    };
    module.exports.schema = ${type}; 
    let schemaConfig = {
        toObject : { getters : true} ,
        toJSON : { getters : true} ,
        versionKey : false
    };
    if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
        schemaConfig["shardKey"] = {
            id: 1
        };
    }
    const ${type}Schema = new mongoose.Schema(${type} , schemaConfig);\r\n

    ${type}Schema.methods.getFHIRField = function () {
        let result = this;
        delete result._doc._id;
        delete result._doc.__v;
        let myCollectionField = _.get(result, "_doc.myCollection");
        if (myCollectionField) {
            let tempCollectionField = _.cloneDeep(myCollectionField);
            _.set(result, "_doc.collection", tempCollectionField);
            delete result._doc.myCollection;
        }
        return result;
    };

    ${type}Schema.pre('save', async function (next) {
        let mongodb = require('../index');
        if (process.env.ENABLE_CHECK_ALL_RESOURCE_ID== "true") {
            let storedID = await mongodb.FHIRStoredID.findOne({
                id: this.id
            });
            if (storedID.resourceType == "${type}") {
                const docInHistory = await mongodb.${type}_history.findOne({
                    id: this.id
                })
                .sort({
                    "meta.versionId" : -1
                });
                let versionId = Number(_.get(docInHistory , "meta.versionId"))+1;
                let versionIdStr = String(versionId);
                _.set(this, "meta.versionId", versionIdStr);
                _.set(this, "meta.lastUpdated", new Date());
            } else {
                console.error('err', storedID);
                return next(new Error(\`The id->\${this.id} stored by resource \${storedID.resourceType}\`));
            }
        } else {
            _.set(this, "meta.versionId", "1");
            _.set(this, "meta.lastUpdated", new Date());
        }
        return next();
    });

    ${type}Schema.post('save', async function (result) {
        let mongodb = require('../index');
        let item = result.toObject();
        delete item._id;
        let version = item.meta.versionId;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : \`:\${process.env.FHIRSERVER_PORT}\`;
        if (version == "1" ) {
            _.set(item, "request", {
                "method": "POST",
                url: \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`
            });
            _.set(item, "response", {
                status: "201"
            });
            let createdDocs = await mongodb['${type}_history'].create(item);
        } else {
            _.set(item, "request", {
                "method": "PUT",
                url: \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`
            });
            _.set(item, "response", {
                status: "200"
            });
            let createdDocs = await mongodb['${type}_history'].create(item);
        }
        await mongodb.FHIRStoredID.findOneAndUpdate({
            id : result.id
        } , {
            id: result.id,
            resourceType: "${type}"
        } , {
            upsert : true
        });

        await storeResourceRefBy(item);
    });

    ${type}Schema.pre('findOneAndUpdate' , async function (next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let version = Number(docToUpdate.meta.versionId);
        this._update.$set.meta = docToUpdate.meta;
        this._update.$set.meta.versionId = String(version+1);
        this._update.$set.meta.lastUpdated = new Date();
        return next();
    });

    ${type}Schema.post('findOneAndUpdate' , async function (result) {
        let mongodb = require('../index');
        let item;
        if (result.value) {
            item = _.cloneDeep(result.value).toObject();
        } else {
            item = _.cloneDeep(result).toObject();
        }
        let version = item.meta.versionId;
        delete item._id;
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : \`:\${process.env.FHIRSERVER_PORT}\`;

        _.set(item, "request", {
            "method": "PUT",
            url: \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`
        });
        _.set(item, "response", {
            status: "200"
        });

        try {
            let history = await mongodb['${type}_history'].create(item);
        } catch (e) {
            console.error(e);
        }

        await storeResourceRefBy(item);

        return result;
    });

    ${type}Schema.pre('findOneAndDelete', async function (next) {
        const docToDelete = await this.model.findOne(this.getFilter());
        if (!docToDelete) {
            next(\`The id->\${this.getFilter().id} not found in ${type} resource\`);
        }
        let mongodb = require('../index');
        let item = docToDelete.toObject();
        delete item._id;

        if (await checkResourceHaveReferenceByOthers(item)) {
            next(\`The \${item.resourceType}:id->\${item.id} is referenced by multiple resource, please do not delete resource that have association\`);
        }

        item.meta.versionId = String(Number(item.meta.versionId)+1);
        let version = item.meta.versionId;

        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : \`:\${process.env.FHIRSERVER_PORT}\`;
        _.set(item, "request", {
            "method": "DELETE",
            url: \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`
        });
        _.set(item, "response", {
            status: "200"
        });
        let createdDocs = await mongodb['${type}_history'].create(item);
        next();
    });

    ${type}Schema.post('findOneAndDelete', async function (resource) {
        await updateRefBy(resource);
        await deleteEmptyRefBy();
    });

    const ${type}Model = mongoose.model("${type}" , ${type}Schema , "${type}");
    return ${type}Model;\r\n}`;

    let importLibs = getImportLibs(result);
    if (!importLibs.includes("const id = require")) {
        importLibs =`const moment = require('moment');\r\nconst _ = require('lodash');\r\n${importLibs}const id = require('${config.requirePath}/id');\r\nconst { storeResourceRefBy, updateRefBy, deleteEmptyRefBy, checkResourceHaveReferenceByOthers } = require("../common");\r\n`;
    } else {
        importLibs =`const moment = require('moment');\r\nconst _ = require('lodash');\r\n${importLibs}\r\nconst { storeResourceRefBy, updateRefBy, deleteEmptyRefBy, checkResourceHaveReferenceByOthers } = require("../common");\r\n`;
    }
    code = `${importLibs}${code};`;
    mkdirp.sync(config.resourcePath);
    fs.writeFileSync(`${config.resourcePath}/${type}.js` , beautify(code , {indent_size : 4 ,pace_in_empty_paren: true }));   
}


module.exports =  function (inputResourceType , option) {
    if (option.cwd) {
        process.chdir(option.cwd);
    }
    //let typePath = option.typePath;
    let resourcePath = option.resourcePath;
   /* if (!typePath) {
        console.error('missing typePath option');
        process.exit(1);
    } else */
    if (!resourcePath) {
        console.error('missing resourcePath option');
        process.exit(1);
    }
    //config.typePath = typePath;
    config.resourcePath = resourcePath;
    //mkdirp.sync(`${config.resourcePath}/`);
    //mkdirp.sync(`${config.typePath}/`);
    config.requirePath = path.relative(resourcePath , "./models/mongodb/FHIRDataTypesSchema").replace(/\\/gm ,"/");
    generateResourceSchema(inputResourceType);
};

function main(inputResourceType , option) {
    if (option.cwd) {
        process.chdir(option.cwd);
    }
    //let typePath = option.typePath;
    let resourcePath = option.resourcePath;
   /* if (!typePath) {
        console.error('missing typePath option');
        process.exit(1);
    } else */
    if (!resourcePath) {
        console.error('missing resourcePath option');
        process.exit(1);
    }
    //config.typePath = typePath;
    config.resourcePath = resourcePath;
    config.requirePath = path.relative(resourcePath , "./models/mongodb/FHIRDataTypesSchema").replace(/\\/gm ,"/");
    generateResourceSchema(inputResourceType);
}

/*main("Bundle" , {
    resourcePath : "./models/mongodb/"
})*/