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
        let docs = await mongodb.Patient_history.find({
            id: id
        }).
        limit(realLimit).
        skip(paginationSkip).
        exec();
        docs = docs.map(v => {
            return v.getFHIRBundleField();
        });
        let count = await mongodb.Patient_history.countDocuments({
            id: id
        });
        let bundle = createBundle(req, docs, count, paginationSkip, paginationLimit, "Patient", {
            type: "history"
        });
        return res.status(200).json(bundle);
    } catch (e) {
        console.log('api api/fhir/Patient/:id/history has error, ', e)
        return res.status(500).json({
            message: 'server has something error'
        });
    }
};