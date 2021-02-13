const fs =require('fs');
const _ = require('lodash');
const beautify = require('js-beautify').js;
const primitiveType = ["Boolean"  , "String" , "Date" , "Number" , "Buffer"];
const path = require('path');
const mkdirp = require('mkdirp');
let schemaJson = JSON.parse(fs.readFileSync(path.join(__dirname ,'./fhir.schema.json') , {encoding: 'utf-8'}));
let FHIRJson = schemaJson.definitions;
let config = {};
let genedType = [];
let allType = [];
function generateResourceSchema (type) {
    if (!FHIRJson[type]) {
        console.error('Unknown resource type ' + type);
        process.exit(1);
    }
    let result = getSchema(FHIRJson[type]);
    cleanChildSchema(result);
    for (let i in result) {
        let cleanType = result[i].type.replace(/[\[\]]/gm , '');
        if (primitiveType.indexOf(cleanType) < 0 ) {
            if (!fs.existsSync(`${config.typePath}/${cleanType}.js`)) {
                generateSchema(cleanType);
            }
        }
        result[i].default = "void 0"
    }
    let topLevelObj = {
        id : {
            type : "String" ,
            unique : "true" ,
            index : "true"
        } ,
        resourceType : {
            type : "String" ,
            required : "true"
        }
    };
    result = Object.assign({} , topLevelObj , result);
    let importLib = "const mongoose = require('mongoose');\r\nconst moment = require('moment');\r\nconst _ = require('lodash');\r\n";
    let code = `module.exports = function () {
    const ${type} = ${JSON.stringify(result , null , 4).replace(/\"/gm , '').replace(/\\/gm , '"')};\r\n
    module.exports.schema = ${type}; 
    const ${type}Schema = new mongoose.Schema(${type} , {
        toObject : { getters : true} ,
        toJSON : { getters : true} 
    });\r\n
    ${type}Schema.methods.getFHIRField = function () {
        let result =  this.toObject();
        delete result._id;
        let version = result.__v;
        if (version) {
          _.set(result , 'meta.versionId' , version.toString());
        }
        delete result.__v;
        delete result['name._id'];
        return result;
    }
    ${type}Schema.post('findOneAndUpdate' , async function (result) {
        if (result.value) {
          result.value.__v++;
          await result.value.save();
        } else {
          result.__v++;
          await result.save();
        }
        return result;
      })
      ${type}Schema.pre('findOneAndUpdate' , async function (next) {
        const docToUpdate = await this.model.findOne(this.getFilter());
        let mongodb = require('../index');
        let item = docToUpdate.toObject();
        delete item._id;
        //item.id = uuid.v4();
        let version = item.__v;
        
        let port = (process.env.FHIRSERVER_PORT == "80" || process.env.FHIRSERVER_PORT == "443") ? "" : \`:\${process.env.FHIRSERVER_PORT}\`;
        if (version == 1) {
            _.set(item , "request" , {
                "method" : "POST" , 
                url : \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`
            });
            _.set(item , "response" , {
                status : "201"
            });
        } else {
            _.set(item , "request" , {
                "method" : "PUT" , 
                url : \`http://\${process.env.FHIRSERVER_HOST}\${port}/\${process.env.FHIRSERVER_APIPATH}/${type}/\${item.id}/_history/\${version}\`
            });
            _.set(item , "response" , {
                status : "200"
            });             
        }
        let createdDocs = await mongodb['${type}_history'].create(item);
        await mongodb.${type}_history.findOneAndUpdate({_id : mongoose.Types.ObjectId(createdDocs._id)} , {
            $set : {__v : version}
        });
        next();
    });
    const ${type}Model = mongoose.model("${type}" , ${type}Schema , "${type}");
    return ${type}Model;\r\n}`;
    for (let i in result) {
        let item = result[i];
        item.default = "void 0";
        let cleanType = item.type.replace(/[\[\]]/gm , '');
        if (checkIsFHIRSchema(cleanType) && !importLib.includes(cleanType)) {
            importLib =`${importLib}const ${cleanType} = require('${config.requirePath}/${cleanType}');\r\n`;
        }
    }
    code = `${importLib}${code}`;
    let uniqGenedType = _.uniq(_.cloneDeep(genedType));
    genedType = [];
    genedType.length = 0;
    for (let gentype of uniqGenedType) {
        if (primitiveType.indexOf(gentype) < 0) {
            generateSchema(gentype);
        }
    }
    uniqGenedType = _.uniq(_.cloneDeep(genedType));
    for (let gentype of uniqGenedType) {
        if (primitiveType.indexOf(gentype) < 0) {
            generateSchema(gentype);
        }
    }
    //console.log(_.uniq(allType));
    
    fs.writeFileSync(`${config.resourcePath}/${type}.js` , beautify(code , {indent_size : 4 ,pace_in_empty_paren: true }));
}
function getSchema (resource) {
    let skipCol = ["resourceType" , "id" , "meta" ,"implicitRules" ,"language" , "text" ,"contained" , "extension" , "modifierExtension"];
    let result = {};
    for (let i in resource.properties) {
        //skip the unusual type
        if (skipCol.indexOf(i) >= 0 ) continue;
        else if (i.includes("_")) continue;
        let type = _.get(resource.properties[i] , "type")
        let refSchema = _.get(resource.properties[i] , "$ref");
        let isCode = _.get(resource.properties[i] , "enum");
        if (type == 'array') {
            //typeStatus = "array";
            let arrayRef = resource.properties[i].items.$ref;
            if (resource.properties[i].items.enum) {
                result[i] = {
                    type : `[String]` 
                }
                continue;
            }
            let arrayRefClean  = arrayRef.split('/');
            type = arrayRefClean[arrayRefClean.length-1];
            if (/^#/.test(arrayRef)) {
                result[i] = {
                    type : `[${type}]` 
                }
                //console.log('custom array:' + type);
            } else {
                result[i] = {
                    type : `[${type}]`
                }
               // console.log('array:' + type);
            }
        }
        else if (refSchema)  {
            if (/^#/.test(refSchema)) {
                //typeStatus = "primitive";
                let refClean = refSchema.split('/');
                type = refClean[refClean.length-1];
                result[i] = {
                    type : type
                }
                //console.log(type);
            } else if (!/^#/.test(refSchema)) {
                //typeStatus = "nested";
                let refClean = refSchema.split('/');
                type = refClean[refClean.length-1];
                result[i] = {
                    type : type ,
                }
                //console.log(type);
            }
        } else if (isCode) {
            type = "String";
            //console.log(type);
            result[i] = {
                type : type ,
                enum : JSON.stringify(isCode)
            }
        } else {
            result[i] = {
                type : type ,
            }
        }
        let isrequired = _.get(resource , "required");
        if (isrequired) {
            for (let item of isrequired) {
                if (item == i) {
                    Object.assign(result[i] , {required : true});
                }
            }
        }
    }
    return result;
}
let stringPrimitiveType = ['uri' , 'url' , 'code' , 'markdown' , 'string' , 'canonical' , 'id'];
let datePrimitiveType = ['instant' ,'time' , 'dateTime' , 'date'];
let numberPrimitiveType = ['unsignedInt' , 'positiveInt' , 'number' , 'decimal' , 'integer'];
function cleanChildSchema (item) {
    for (let i in item) {
        let isArray = /[\[\]]/gm.test(item[i].type);
        let type = item[i].type.replace(/[\[\]]/gm,'');
        if (primitiveType.indexOf(type) < 0) {
            if (stringPrimitiveType.indexOf(type) >= 0 ) {
                item[i].type = isArray ? "[String]" : "String";
            } else if (numberPrimitiveType.indexOf(type) >= 0) {
                item[i].type = isArray ? "[Number]" : "Number";
            } else if (datePrimitiveType.indexOf(type) >= 0) {
                if (isArray) {
                    
                } else {
                    if (item[i].type == "date") {
                        item[i].get = "function (v) {return moment(v).format('YYYY-MM-DD');}";
                    } else if (item[i].type == "dateTime") {
                        item[i].get = "function (v) {return moment(v).format('YYYY-MM-DDThh:mm:ssZ');}";
                    } else if (item[i].type == "instant") {
                        item[i].get = "function (v) {return moment(v).format('YYYY-MM-DDThh:mm:ss.SSSZ');}";
                    } else if (item[i].type == "time") {
                        item[i].get = "function (v) {return moment(v).format('hh:mm:ss');}";
                    }
                }
                item[i].type = isArray ? "[Date]" : "Date";
                
            } else if (type == "boolean") {
                item[i].type = isArray ? "[Boolean]" : "Boolean";
            } else if (type == "base64Binary") {
                item[i].type = isArray ? "[Buffer]" : "Buffer";
            } 
        }
        allType.push(item[i].type.replace(/[\[\]]/gm,''));
    }
}
function checkIsFHIRSchema (type) {
    return fs.existsSync(`${config.typePath}/${type}.js`);
}
function generateSchema (type , isFinalClean = false) {
    let schema = getSchema(FHIRJson[type]);
    if (!checkIsFHIRSchema (type)) {
        cleanChildSchema(schema);
        let importLib = "const mongoose = require('mongoose');\r\n";
        for (let i in schema) {
            let item = schema[i];
            item.default = "void 0";
            let cleanType = item.type.replace(/[\[\]]/gm , '');
            if (primitiveType.indexOf(cleanType) < 0 && !importLib.includes(cleanType)) {
                importLib =`${importLib}const ${cleanType} = require('./${cleanType}');\r\n`;
                genedType.push(cleanType);
            }
        }
        let schemaStr = JSON.stringify(schema , null , 4).replace(/\"/gm , '')
        let code = `module.exports = new mongoose.Schema (${schemaStr.replace(/\\/gm , '"')} , { _id : false });`;
        code = `${importLib}${code}`;
        fs.writeFileSync(`${config.typePath}/${type}.js` , beautify(code , {indent_size : 4 ,pace_in_empty_paren: true }));
    }
}
/**
 * @param {String} inputResourceType The FHIR resource type that you want to generate
 * @param {Object} option  
 * @param {String} option.typePath The path to save FHIR data type
 * @param {String} option.resourcePath The path to save  FHIR resource type 
 * @param {String} option.cwd Current work directory
 */
module.exports =  function (inputResourceType , option) {
    if (option.cwd) {
        process.chdir(option.cwd);
    }
    let typePath = option.typePath;
    let resourcePath = option.resourcePath;
    if (!typePath) {
        console.error('missing typePath option');
        process.exit(1);
    } else if (!resourcePath) {
        console.error('missing resourcePath option');
        process.exit(1);
    }
    config.typePath = typePath;
    config.resourcePath = resourcePath;
    mkdirp.sync(`${config.resourcePath}/`);
    mkdirp.sync(`${config.typePath}/`);
    config.requirePath = path.relative(resourcePath ,typePath).replace(/\\/gm ,"/");
    generateResourceSchema(inputResourceType);
}