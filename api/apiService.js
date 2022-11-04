const mongodb = require('../models/mongodb');
const fetch = require('node-fetch');
const _ = require('lodash');
const AbortController = require('abort-controller');
const FHIR = require('fhir').Fhir;
const { handleError } = require('../models/FHIR/httpMessage');
const jwt = require('jsonwebtoken');
const jsonPath = require("jsonpath");
function getDeepKeys(obj) {
    let keys = [];
    for (let key in obj) {
        keys.push(key);
        if (typeof obj[key] === "object") {
            let subkeys = getDeepKeys(obj[key]);
            keys = keys.concat(subkeys.map(function (subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}
/**
 * Check item is real object.
 * 1. Is Object
 * 2. then check is array and check some element in array is object 
 * @param {*} obj 
 * @return {boolean}
 */
function isRealObject(obj) {
    if (_.isObject(obj)) {
        if (_.isArray(obj)) {
            return obj.some(v => isRealObject(v));
        }
        return true;
    }
    return false;
}

async function findResourceById(resource, id) {
    try {
        let doc = await mongodb[resource].findOne(
            {
                id: id
            }
        ).exec();
        if (doc) return doc;
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

/**
 * 
 * @param {string} id The resource id
 * @param {string} resourceType Resource type
 * @returns status: 1 mean "exist", 2 mean "not exist", 0 mean "another error"
 */
async function isDocExist(id, resourceType) {
    try {
        let data = await mongodb[resourceType].countDocuments({id: id}).limit(1);
        if (data > 0) {
            return {
                status: 1,
                error: ""
            };
        }
        return {
            status: 2,
            error: ""
        };
    } catch(e) {
        console.error(e);
        return {
            status: 0,
            error: e
        };
    }
}


function getNotExistReferenceList(checkReferenceRes) {
    let notExistReferenceList = [];
    for (let reference of checkReferenceRes.checkedReferenceList) {
        if (!reference.exist) {
            notExistReferenceList.push({
                path: reference.path ,
                value: reference.value
            });
        }
    }
    return notExistReferenceList;
}

function renameCollectionFieldName(data) {
    let collectionNodes = jsonPath.nodes(data, "$..collection");
    for (let node of collectionNodes) {
        node.path.shift();
        let originalPath = node.path.join(".");
        _.omit(data, originalPath); 
        node.path = node.path.map( v=> {
            if (v === "collection") return "myCollection";
            return v;
        });
        let collectionPath = node.path.join(".");
        let collectionItem = _.cloneDeep(node.value);
        _.set(data, collectionPath, collectionItem);
    }
}

module.exports = {
    getDeepKeys: getDeepKeys,
    isRealObject: isRealObject,
    findResourceById: findResourceById,
    isDocExist: isDocExist,
    getNotExistReferenceList: getNotExistReferenceList,
    renameCollectionFieldName: renameCollectionFieldName
};