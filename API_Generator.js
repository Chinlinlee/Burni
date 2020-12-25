const fhirgen = require('./FHIR-mongoose-Models-Generator');
const fs =require('fs');
const mkdirp = require('mkdirp');
const beautify = require('js-beautify').js;
/**
 * 
 * @param {Object} option 
 * @param {Array} option.resources the resources want to use
 */

function generateAPI(option) {
    for (let res of option.resources) {
        fhirgen(res, {resourcePath : "./models/mongodb/model" , typePath: "./models/mongodb/FHIRTypeSchema"});
        mkdirp.sync(`./api/FHIR/${res}/controller`);
        const get = `
        const _ = require('lodash');
        const mongodb = require('models/mongodb');
        const {createBundle} = require('models/FHIR/func');
        const queryBuild = require('models/FHIR/queryBuild.js');
        const FHIRFilter = {
            _id: 0,
            __v: 0
        }
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
            Object.keys(queryParameter).forEach(key => {
                try {
                    paramsSearch[key](queryParameter);
                } catch (e) {
                    if (key != "$and") delete queryParameter[key];
                }
            });
            if (queryParameter.$and.length == 0) {
                delete queryParameter["$and"];
            }
            try {
                let docs = await mongodb.${res}.find(queryParameter ,FHIRFilter).
                limit(realLimit).
                skip(paginationSkip).
                exec();
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
                    return res.status(errorMessage.code).send(errorMessage);
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
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}.js` , beautify(get));
        fs.writeFileSync(`./api/FHIR/${res}/controller/get${res}ById.js` , beautify(getById));
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

        router.post('/' ,require('./controller/post${res}'));

        router.put('/:id' , require("./controller/put${res}"));

        router.delete('/:id',  require("./controller/delete${res}"));
        module.exports = router;`
        fs.writeFileSync(`./api/FHIR/${res}/index.js` , beautify(indexJs));
    }
}

/*generateAPI({
    resources : ["Patient" , "MedicationRequest" , "Observation" , "ImagingStudy" , "Claim"]
})*/

module.exports = {
    generateAPI : generateAPI
}






