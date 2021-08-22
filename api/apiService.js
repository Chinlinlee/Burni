const mongodb = require('../models/mongodb');
const fetch = require('node-fetch');
const _ = require('lodash');
const AbortController = require('abort-controller');
const FHIR = require('../models/FHIR/fhir').Fhir;
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

async function checkReference(resourceData) {
    let checkedReferenceList = [];
    let resourceDeepKeys = getDeepKeys(resourceData);
    let referenceKeys = resourceDeepKeys.filter(
        v => v.endsWith(".reference")
    );
    for (let key of referenceKeys) {
        let referenceValue = _.get(resourceData, key);
        let referenceValueSplit = referenceValue.split('|')[0].split('/');
        if (/^(http|https):\/\//g.test(referenceValue)) {
            //do fetch to get response
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1268 + 1231);
            try {
                let fetchRes = await fetch(referenceValue, {
                    headers: {
                        accept: "application/fhir+json"
                    } ,
                    signal: controller.signal
                });
                if (fetchRes.status == 200) {
                    let referenceJson = await fetchRes.json();
                    let fhir = new FHIR();
                    if (fhir.validate(referenceJson).valid) {
                        checkedReferenceList.push({
                            exist: true,
                            path: key,
                            value: referenceValue
                        });
                    } else {
                        checkedReferenceList.push({
                            exist: false,
                            path: key,
                            value: referenceValue
                        });
                    }
                } else {
                    checkedReferenceList.push({
                        exist: false,
                        path: key,
                        value: referenceValue
                    });
                }
            } catch (e) {
                checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            } finally {
                clearTimeout(timeoutId);
            }
        } else if (referenceValueSplit.length >= 2) {
            let resourceName = referenceValueSplit[referenceValueSplit.length - 2];
            let resourceId = referenceValueSplit[referenceValueSplit.length - 1];
            let doc = await findResourceById(resourceName, resourceId);
            if (doc) {
                checkedReferenceList.push({
                    exist: true,
                    path: key,
                    value: referenceValue
                });
            } else {
                checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            }
        } else if (/urn:oid:[0-2](\.[1-9]\d*)+/i.test(referenceValue) ||
            /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(referenceValue)) {
            //Only Bundle entry have OID or UUID reference?
            let referenceTargetFullUrl = resourceDeepKeys.find(
                v => _.get(resourceData, v) == referenceValue &&
                    v.endsWith("fullUrl")
            );
            if (referenceTargetFullUrl) {
                checkedReferenceList.push({
                    exist: true,
                    path: key,
                    value: referenceValue
                });
            } else {
                checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            }
        }
    }
    if (checkedReferenceList.length > 0) {
        return {
            status : checkedReferenceList.every(v=> v.exist),
            checkedReferenceList: checkedReferenceList
        }
    }
    return {
        status: true,
        checkedReferenceList: checkedReferenceList
    };
}

module.exports = {
    getDeepKeys: getDeepKeys,
    findResourceById: findResourceById,
    checkReference: checkReference
}