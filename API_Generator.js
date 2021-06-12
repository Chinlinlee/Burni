const fhirgen = require('./FHIR-mongoose-Models-Generator/resourceGenerator');
const fs =require('fs');
const mkdirp = require('mkdirp');
const beautify = require('js-beautify').js;
const _ = require('lodash');
require('dotenv').config();

function getDeepKeys(obj) {
    var keys = [];
    for(var key in obj) {
        keys.push(key);
        if(typeof obj[key] === "object") {
            var subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(subkeys.map(function(subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}

const tokenDataTypes = [
    {
        dataType : "Coding" , 
        uri : "" ,
        code : "code"
    } ,
    {
        dataType : "CodeableConcept" ,
        uri : "coding.system" ,
        code : "coding.code"
    } ,
    {
        dataType : "ContactPoint" ,
        uri : "" ,
        code : "value"
    } ,
    {
        dataType : "Identifier" ,
        uri : "" ,
        code : "value"
    } ,
    {
        dataType : "code" ,
        uri : "" ,
        code : ""
    } ,
    {
        dataType : "string" ,
        uri : "" ,
        code : ""
    } ,
    {
        dataType : "boolean" ,
        uri : "" ,
        code : ""
    }
];

const datePrimitiveType = ['instant' ,'time' , 'dateTime' , 'date'];

const genParamFunc = {
    "string" : (param , field , schema={}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.` , "");
            fieldInResource = fieldInResource.trim();
            if (param.includes ('address')) {
                txt += `
                paramsSearch["${param}"] = (query) => {
                    let buildResult = queryBuild.addressQuery(query["${param}"] ,"${fieldInResource}");
                    query.$and.push(buildResult);
                    delete query[${param}];
                } 
                `;
            } else if (param == "name") {
                txt+= `
                paramsSearch["name"] = (query) => {
                    if (!_.isArray(query["name"])) {
                        query["name"] = [query["name"]]
                    }
                    for (let item of query["name"]) {
                        let buildResult = queryBuild.nameQuery(item , "name");
                        query.$and.push(buildResult);
                    }
                    delete query['name'];
                }
                `
            } else {
                txt += `
                paramsSearch["${param}"] = (query) => {
                    queryBuild.arrayStringBuild(query ,"${param}" , "${fieldInResource}" , ["${param}"]);
                } 
                `
            }
        }
        return txt;
    } , 
    "token" : (param , field , schema={}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.` , "");
            fieldInResource = fieldInResource.trim();
            if (param == "phone") {
                txt+=`
                paramsSearch["phone"] = (query) => {
                    let buildResult =queryBuild.tokenQuery(query["phone"] , "value" , "telecom" , "phone");
                    for (let i in buildResult) {
                        query.$and.push({
                            [i] : buildResult[i]
                        });
                    }
                    delete query['phone'];
                }
                `
            } else if (param == "email") {
                txt+=`
                paramsSearch["email"] = (query) => {
                    let buildResult =queryBuild.tokenQuery(query["email"] , "value" , "telecom" , "email");
                    for (let i in buildResult) {
                        query.$and.push({
                            [i] : buildResult[i]
                        });
                    }
                    delete query['email'];
                }
                `
            } else if (param =="identifier") {
                txt+=`
                paramsSearch["identifier"] = (query) => {
                    let buildResult = queryBuild.tokenQuery(query["identifier"] , "value" , "identifier" ,"");
                    for (let i in buildResult) {
                        query.$and.push({
                            [i] : buildResult[i]
                        });
                    }
                    delete query['identifier'];
                }
                `
            } else {
                let deepKeys = getDeepKeys(_.cloneDeep(schema));
                if (/\(.*\)/.test(fieldInResource)) {
                    fieldInResource = fieldInResource.substr(0 , fieldInResource.indexOf("."));
                }
                let typePath = deepKeys.filter(v=> {
                    let fieldNamePath = fieldInResource.split(".");
                    return fieldNamePath.every(item => v.includes(item) && v.includes("type"))
                });
                typePath = typePath.reduce(function (a , b){
                    return a.length < b.length ? a : b
                })
                let typeOfField = _.get(schema , typePath);
                if (typeOfField == "object") {
                    let propertiesOfField = _.get(schema , typePath.replace(".type" , ".properties"));
                    let propertiesKeysLength  =Object.keys(propertiesOfField).length;
                    if (propertiesKeysLength == 3) {
                        typeOfField = "CodeableConcept"
                    } else if (propertiesKeysLength == 5) {
                        typeOfField = "Coding"
                    } else {
                        typeOfField = "Identifier"
                    }
                }
                let hitToken = tokenDataTypes.find(v=> v.dataType == typeOfField);
                if (hitToken) {
                    let isCodeableConcept = hitToken.dataType == "CodeableConcept";
                    txt+=`
                    paramsSearch["${param}"] = (query) => {
                        let buildResult = queryBuild.tokenQuery(query["${param}"] , "${hitToken.code}" , "${fieldInResource}" ,"" , ${isCodeableConcept});
                        for (let i in buildResult) {
                            query.$and.push({
                                [i] : buildResult[i]
                            });
                        }
                        delete query['${param}'];
                    }
                    `;
                } else {
                    txt+=`
                    paramsSearch["${param}"] = (query) => {
                        let buildResult = queryBuild.tokenQuery(query["${param}"] , "" , "${fieldInResource}" ,"" , false);
                        for (let i in buildResult) {
                            query.$and.push({
                                [i] : buildResult[i]
                            });
                        }
                        delete query['${param}'];
                    }
                    `;
                }
            }
        } 
        return txt;
    } ,
    "number" : (param , field , schema={}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.` , "");
            fieldInResource = fieldInResource.trim();
            txt += `
            paramsSearch["${param}"] = (query) => {
                    let buildResult = numberQuery(item , "${field}");
                    query.$and.push({
                        "${fieldInResource}": buildResult
                    });
                    delete query["${field}"];
                } 
            }
            `
        }
        return txt;
    } , 
    "date" : (param , field , schema={}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.` , "");
            fieldInResource = fieldInResource.trim();
            if (!fieldInResource.includes(")")) {
                txt += `
                paramsSearch["${param}"] = (query) => {
                    if (!_.isArray(query["${param}"])) {
                        query["${param}"] = [query["${param}"]]
                    }
                    for (let i in query["${param}"]) {
                        let buildResult = queryBuild.dateQuery(query["${param}"][i] , "${fieldInResource}");
                        if (!buildResult) {
                            errorMessage = handleError.processing(\`invalid date: \${query["${param}"]}\`)
                            throw new Error(errorMessage);
                        }
                        query.$and.push(buildResult);
                    }
                    delete query["${param}"];
                }
                `
            } else {
                console.log("date insteadof:" , fieldInResource);
                fieldInResource = fieldInResource.substr(0 , fieldInResource.indexOf(" as")).replace(/[\(\)]/gm , "");
                let resourceFields = Object.keys(schema.properties);
                let hitTokenFields = resourceFields.filter(v=> v.includes(fieldInResource));
                for(let field of hitTokenFields) {
                    let hitDate= datePrimitiveType.includes(schema.properties[field].type);
                    console.log(schema.properties[field].type);
                    console.log(hitDate);
                    if (hitDate) {
                        console.log(field);
                    }
                }
            }
        }
        return txt;
    } ,
    "reference" : (param , field , schema={}) => {
        let txt = "";
        let searchFields = field.split("|");
        for (let searchField of searchFields) {
            let [resource] = searchField.split('.');
            let fieldInResource = searchField.replace(`${resource}.` , "");
            fieldInResource = fieldInResource.trim();
            if (fieldInResource.includes("where")) {
                let lastIndexFieldInField = fieldInResource.lastIndexOf(".");
                fieldInResource = fieldInResource.substring(0  , lastIndexFieldInField) + ".reference";
            } else {
                fieldInResource = fieldInResource + ".reference";
            }
            txt += `
                paramsSearch["${param}"] = (query) => {
                    let buildResult = queryBuild.referenceQuery(query["${param}"] , "${fieldInResource}");
                    for (let i in buildResult) {
                        query.$and.push({
                            [i] : buildResult[i]
                        });
                    }
                    delete query["${param}"];
                }
                `
        }
        return txt;
    }
}


/**
 * 
 * @param {Object} option 
 * @param {Array} option.resources the resources want to use
 */
function generateAPI(option) {
    for (let res of option.resources) {
        fhirgen(res, {resourcePath : "./models/mongodb/model" , typePath: "./models/mongodb/FHIRTypeSchema"});
    }
    
    for (let res of option.resources) {
        mkdirp.sync(`./api/FHIR/${res}/controller`);

        //#region search
        let get = `
        const _ = require('lodash');
        const mongodb = require('models/mongodb');
        const {createBundle} = require('models/FHIR/func');
        const queryBuild = require('models/FHIR/queryBuild.js');
        const {handleError} = require('models/FHIR/httpMessage');

        module.exports = async function (req, res) {
            let queryParameter =  _.cloneDeep(req.query);
            let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
            let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
            _.set(req.query , "_offset" ,paginationSkip);
            _.set(req.query , "_count" , paginationLimit);
            let realLimit = paginationLimit+ paginationSkip;
            delete queryParameter['_count'];
            delete queryParameter['_offset'];
            Object.keys(queryParameter).forEach(key => {
                if (!queryParameter[key] || _.isObject(queryParameter[key])) {
                    delete queryParameter[key];
                }
            });
            queryParameter.$and = [];
            for (let key in queryParameter) {
                try {
                    paramsSearch[key](queryParameter);
                } catch (e) {
                    if (key != "$and") {
                        console.error(e);
                        return res.status(400).send(handleError.processing(\`Unknown search parameter \${key} or value \${queryParameter[key]}\`))
                    }
                }
            }
            if (queryParameter.$and.length == 0) {
                delete queryParameter["$and"];
            }
            try {
                let docs = await mongodb.${res}.find(queryParameter).
                limit(realLimit).
                skip(paginationSkip).
                sort({_id : -1 }).
                exec();
                docs = docs.map(v=> {
                    return v.getFHIRField();
                });
                let count = await mongodb.${res}.countDocuments(queryParameter);
                let bundle = createBundle(req , docs , count , paginationSkip , paginationLimit , "${res}");
                return res.status(200).json(bundle);
            } catch (e) {
                console.log('api api/fhir/${res}/ has error, ', e)
                return res.status(500).json({
                    message: 'server has something error'
                });
            }
        };

        const paramsSearch = {
            "_id" : (query) => {
                query.$and.push({
                    id : query["_id"]
                });
                delete query["_id"];
            }
        }`

        let searchParameter = fs.readFileSync('./FHIRParametersClean.json' , 'utf-8');
        searchParameter = JSON.parse(searchParameter);
        let resSearchParams = searchParameter[res];
        let mongodb = require('./models/mongodb');
        //console.log(res);
        let resJsonSchema = mongodb[res].jsonSchema();
        for (let key in resSearchParams) {
            let paramObj = resSearchParams[key];
            let param = paramObj["parameter"];
            let type = paramObj["type"];
            let field = paramObj["field"];
            try {
                let searchFuncTxt = genParamFunc[type](param , field , resJsonSchema);
                get+= beautify(searchFuncTxt);
            } catch (e) {
                if (e.message.includes("not a function")) {
                    console.log(type);
                    console.error(e);
                }
            }
        }
        //#endregion

        //#region getById
        const getById = `
        const mongodb = require('models/mongodb');
        const {handleError} = require('../../../../models/FHIR/httpMessage');
        module.exports = async function (req, res) {
            let id = req.params.id;
            try {
                let docs = await mongodb.${res}.findOne({id : id}).exec();
                if (docs) {
                    return res.status(200).json(docs.getFHIRField());
                }
                let errorMessage = \`not found ${res}/\${id}\`;
                return res.status(404).json(handleError["not-found"](errorMessage));
            } catch (e) {
                console.log('api api/fhir/${res}/:id has error, ', e)
                return res.status(500).json(handleError.exception('server has something error'));
            }
        };
        `
        //#endregion

        //#region getHistory
        const getHistory = `
        const _ = require('lodash');
        const mongodb = require('models/mongodb');
        const {
            createBundle
        } = require('models/FHIR/func');
        const queryBuild = require('models/FHIR/queryBuild.js');

        module.exports = async function(req, res) {
            let queryParameter = _.cloneDeep(req.query);
            let id = req.params.id;
            let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
            let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
            _.set(req.query, "_offset", paginationSkip);
            _.set(req.query, "_count", paginationLimit);
            let realLimit = paginationLimit + paginationSkip;
            delete queryParameter['_count'];
            delete queryParameter['_offset'];
            try {
                let docs = await mongodb.${res}_history.find({ id : id}).
                limit(realLimit).
                skip(paginationSkip).
                sort({_id : -1 }).
                exec();
                docs = docs.map(v => {
                    return v.getFHIRBundleField();
                });
                let count = await mongodb.${res}_history.countDocuments({ id : id });
                let bundle = createBundle(req, docs, count, paginationSkip, paginationLimit, "${res}" , {
                    type : "history"
                });
                return res.status(200).json(bundle);
            } catch (e) {
                console.log('api api/fhir/${res}/:id/history has error, ', e)
                return res.status(500).json({
                    message: 'server has something error'
                });
            }
        };
        `;
        //#endregion

        //#region getHistoryById
        const getHistoryById = `
        const mongodb = require('models/mongodb');
        const {
            handleError
        } = require('../../../../models/FHIR/httpMessage');
        module.exports = async function(req, res) {
            let id = req.params.id;
            let version = req.params.version;
            try {
                let docs = await mongodb.${res}_history.findOne({
                    $and : [
                        {
                            id: id
                        } ,
                        {
                            __v : version
                        }
                    ]
                }).exec();
                if (docs) {
                    return res.status(200).json(docs.getFHIRField());
                }
                let errorMessage = \`not found ${res}/\${id} with version \${version} in history\`;
                return res.status(404).json(handleError["not-found"](errorMessage));
            } catch (e) {
                console.log('api api/fhir/${res}/:id has error, ', e)
                return res.status(500).json(handleError.exception('server has something error'));
            }
        };
        `;
        //#endregion

        //#region create resource (post)
        const post = `
        const mongodb = require('models/mongodb');
        const { handleError } = require('../../../../models/FHIR/httpMessage');
        const uuid = require('uuid');
        const errorMessage = {
            "code": ""  , 
            "message" : ""
        };
        module.exports = async function (req, res) {
            console.log(req.body);
            try {
                let resFunc = {
                    "true" : (doc) => {
                        return res.status(201).send(doc);
                    } , 
                    "false" : (doc) => {
                        if (errorMessage.message.code == 11000) {
                            return res.status(409).json(handleError.duplicate(errorMessage.message));
                        }
                        return res.status(500).send(handleError.exception(errorMessage.message));
                    }
                }
                let insertData = req.body;
                let [status , doc]  = await insert${res}(insertData);
                return resFunc[status](doc);
            } catch(e) {
                console.error(\`error\`);
                console.log(e);
            }
        }

        async function insert${res}(insertData) {
            return new Promise(async (resolve, reject) => {
                try {
                    delete insertData.text;
                    delete insertData.meta;
                    insertData.id = uuid.v4();
                    let new${res} = new mongodb.${res}(insertData);
                    new${res}.save(function (err, doc) {
                        if (err) {
                            errorMessage.message = err;
                            return resolve([false ,err]);
                        }
                        return resolve([true, doc.getFHIRField()]);
                    });
                } catch (e) {
                    console.error(e);
                }
            });
        }
        `
        //#endregion

        //#region update (put)
        const put = `
        const mongodb = require('models/mongodb');
        const { handleError } = require('models/FHIR/httpMessage');

        
        const errorMessage = {
            code : "" ,
            message : ""
        }

        module.exports = async function (req ,res) {
            let resFunc = {
                "true" : (data) => {
                    return res.status(data.code).send(data.doc);
                } , 
                "false" : (error) => {
                    return res.status(500).send(handleError.exception(errorMessage.message));
                }
            }
            let dataExist = await isDocExist(req.params.id);
            if (dataExist == 0) {
                return res.status(500).json(handleError.exception(errorMessage.message));
            }
            let dataFuncAfterCheckExist = {
                0 : (req) => {
                    return ["false" , ""];
                } ,
                1 : doUpdateData , 
                2 : doInsertData
            }
            let [ status , result] =await  dataFuncAfterCheckExist[dataExist](req);
            return resFunc[status](result);
        }

        function isDocExist (id) {
            return new Promise (async (resolve , reject) => {
                mongodb.${res}.findOne ({id : id} , async function (err ,doc) {
                    if (err) {
                        errorMessage.message = err;
                        return resolve (0); //error
                    }
                    if (doc) {
                        return resolve(1); //have doc
                    } else {
                        return resolve(2); //no doc
                    }
                });
            });
        }
        function doUpdateData (req) {
            return new Promise((resolve , reject) => {
                let data = req.body;
                let id = req.params.id;
                delete data._id;   
                delete data.text;
                delete data.meta;
                data.id = id;
                mongodb.${res}.findOneAndUpdate({id : id }  ,{$set : data} , { new : true , rawResult: true} , function (err , newDoc) {
                    if (err) {
                        errorMessage.message = err;
                        return resolve (["false" , err]);
                    }
                    return resolve(["true", {
                        id: id,
                        doc: newDoc.value.getFHIRField() , 
                        code : 200
                    }]);
                });
            });
        }

        function doInsertData(req) {
            return new Promise ((resolve ) => {
                let data = req.body;
                data.id = req.params.id;
                delete data.text;
                delete data.meta;
                let updateData = new mongodb.${res}(data);
                updateData.save(function (err, doc) {
                    errorMessage.message = err;
                    return resolve(err ? ["false",err] : ["true", {
                        code : 201 , 
                        doc: doc.getFHIRField()
                    }]);
                });
            });
        }`
        //#endregion

        //#region delete
        const deleteJs  = `
        const mongodb = require('models/mongodb');
        const {getDeleteMessage , handleError} = require('../../../../models/FHIR/httpMessage');

        const errorMessage = {
            "message" : "" , 
            "code" : ""
        }

        module.exports  = async function(req ,res) {
            let resFunc = {
                "true" : (doc) => {
                    if (!doc) {
                        let errorMessage = \`not found ${res}/\${req.params.id}\`;
                        return res.status(404).json(handleError["not-found"](errorMessage));
                    }
                    return res.status(200).json(getDeleteMessage("${res}" , req.params.id));
                } , 
                "false" : (doc) => {
                    return res.status(500).json(handleError.exception(errorMessage.message));
                }
            }
            let [status , doc] = await delete${res}(req);
            return resFunc[status.toString()](doc);
        }

        async function delete${res} (req) {
            return new Promise((resolve)=> {
                const id = req.params.id;
                mongodb.${res}.findOneAndDelete({id : id} , (err , doc)=> {
                    if (err) {
                        console.log(err);
                        errorMessage.code = 500;
                        errorMessage.message = err;
                        return resolve([false , err]);
                    } 
                    return resolve([true, doc]);
                })
            });
        }`
        //#endregion

        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}.js` , beautify(get));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}ById.js` , beautify(getById));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}History.js` , beautify(getHistory));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}HistoryById.js` , beautify(getHistoryById));
        fs.writeFileSync(`./api/FHIR/${res}/controller/post${res}.js` , beautify(post));
        fs.writeFileSync(`./api/FHIR/${res}/controller/put${res}.js` , beautify(put));
        fs.writeFileSync(`./api/FHIR/${res}/controller/delete${res}.js` , beautify(deleteJs));
        let indexJs = `
        const express = require('express');
        const router = express.Router();
        const joi = require('joi');
        const {validateParams} = require('api/validator');

        router.use((req, res, next) => {
            res.set('Content-Type', 'application/fhir+json');
            next();
        });
        router.get('/' , validateParams({
            "_offset" : joi.number().integer() ,
            "_count" : joi.number().integer()
        } , "query" ,{ allowUnknown : true }) ,require('./controller/get${res}'));

        router.get('/:id' ,require('./controller/get${res}ById'));

        router.get('/:id/_history' ,validateParams({
            "_offset": joi.number().integer(),
            "_count": joi.number().integer()
        }, "query", {
            allowUnknown: true
        }) , require('./controller/get${res}History'));

        router.get('/:id/_history/:version' , require('./controller/get${res}HistoryById'));

        router.post('/' ,require('./controller/post${res}'));

        router.put('/:id' , require("./controller/put${res}"));

        router.delete('/:id',  require("./controller/delete${res}"));
        module.exports = router;`
        fs.writeFileSync(`./api/FHIR/${res}/index.js` , beautify(indexJs));
    }
}
function generateMetaData () {
    let dirInFHIRAPI = fs.readdirSync('./api/FHIR' , {withFileTypes : true})
    .filter(itemInDir => itemInDir.isDirectory())
    .map(dirItem => {
        if (dirItem.name.toLocaleLowerCase() != "metadata") {
            return dirItem.name;
        }
    });
    dirInFHIRAPI = _.compact(dirInFHIRAPI);
    const fhirUrl = "http://hl7.org/fhir/R4";
    let metaData = {
        "rest" : [
            {
                "mode" : "server" , 
                "resource" : [] 
            }
        ]
    };
    console.log(dirInFHIRAPI);
    for (let resource of dirInFHIRAPI) {
        metaData.rest[0].resource.push( {
            "type" : resource , 
            "profile" : `${fhirUrl}/${resource.toLocaleLowerCase()}.html` ,
            "interaction" : [
                {
                    "code" : "read"
                } , 
                {
                    "code" : "update"
                } , 
                {
                    "code" : "delete"
                } , 
                {
                    'code' : "create"
                }
            ] , 
            "updateCreate" : true , 
            "conditionalDelete" : "single" ,
            "searchInclude" : [] ,
            "searchRevInclude" : [] ,
            "searchParam" : [
                {
                    "name" : "_id" , 
                    "type" : "string"
                } 
            ]
        });
    }
    mkdirp.sync("./api/FHIR/metadata");
    mkdirp.sync("./api/FHIR/metadata/controller");
    let metadataRouteIndexText = `
    const express = require('express');
    const router = express.Router();
    const {validateParams} = require('../../validator');
    const Joi = require('joi');
    
    router.use((req, res, next) => {
        res.set('Content-Type', 'application/fhir+json');
        next();
    });
    
    router.get('/' , require('./controller/getMetadata'));
    
    module.exports = router;`
    fs.writeFileSync("./api/FHIR/metadata/index.js" , beautify(metadataRouteIndexText));
    let metadataText = `
    const fhirUrl = "http://hl7.org/fhir/R4";

    module.exports = async function (req ,res) {
        const metaData = {
            "resourceType": "CapabilityStatement",
            "status": "active",
            "date": Date.now().toString(),
            "publisher": "Not provided",
            "kind": "instance",
            "software": {
            "name": "Simple-Express-FHIR-Server",
            "version": "1.0.0"
            },
            "implementation": {
            "description": "Simple-Express FHIR R4 Server",
            "url": \`http://${process.env.FHIRSERVER_HOST}/${process.env.FHIRSERVER_APIPATH}\`
            },
            "fhirVersion": "4.0.1",
            "format": [ "json" ],
            "rest" : ${JSON.stringify(metaData.rest[0] , null , 4)}
        }
        res.json(metaData);
    }
    `
    fs.writeFileSync("./api/FHIR/metadata/controller/getMetadata.js" , beautify(metadataText));
}
/*generateAPI({
    resources : ["Patient" , "MedicationRequest" , "Observation" , "ImagingStudy" , "Claim"]
})*/

module.exports = {
    generateAPI : generateAPI , 
    generateMetaData : generateMetaData
}






