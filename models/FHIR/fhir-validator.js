const _ = require('lodash');
const fetch = require('node-fetch');
const mongodb = require('../mongodb');
const { handleError, issue, OperationOutcome } = require('./httpMessage');
const flatten = require('flat');
const hash = require('object-hash');
const fs = require('fs');
const nodeUrl = require('url');
const https = require('https');
const { logger } = require('../../utils/log');
const path = require('path');
const VALIDATION_API_URL = process.env.VALIDATION_API_URL;

/**
 * @param {string} profileUrl 
 */
async function validateByProfile(profileUrl, resourceContent) {
    try {
        await storeValidationFile(profileUrl);
        await refreshResourceResolver();
        let validation = await validate([profileUrl], resourceContent);
        if (validation.status) {
            return JSON.parse(validation.data);
        } else {
            throw new Error(validation.data);
        }
    } catch(e) {
        throw e;
    }
}

async function validateByMetaProfile(resourceContent) {
    try {
        let metaProfile = _.get(resourceContent, "meta.profile");
        let storeValidationFileResultList = [];
        if (metaProfile) {
            for (let i = 0 ; i< metaProfile.length; i++) {
                let profileUrl = metaProfile[i];
                let storeValidationFileResult = await storeValidationFile(profileUrl);
                storeValidationFileResultList.push(storeValidationFileResult);
            }
            let haveNewValidationFile = storeValidationFileResultList.findIndex(v=> v.new) >= 0;
            if (haveNewValidationFile) await refreshResourceResolver();
            let validation = await validate(metaProfile, resourceContent);
            if (validation.status) {
                return JSON.parse(validation.data);
            } else {
                throw new Error(validation.data);
            }
        }
    } catch(e) {
        throw e;
    }
}

/**
 * Store StructureDefinition, ValueSet, CodeSystem json when not exists in MongoDB.
 * @param {string} url 
 */
 async function storeValidationFile(url) {
    try {
        let validationFile = await mongodb.FHIRValidationFiles.findOne({
            url: url
        });
        if (!validationFile) {
            logger.info(`[Info: Fetch Profile From URL: ${url}]`);
            let fetchRes = await fetch(url, {
                headers: {
                    "accept": "application/fhir+json"
                }
            });
            let resJson = await fetchRes.json();
            if (resJson.resourceType === "StructureDefinition") {
                await fetchValueSet(resJson);
            } else if (resJson.resourceType === "ValueSet") {
                await fetchCodeSystem(resJson);
            }
            let contentHash = hash(resJson);
            let urlHash = hash({url:url});
            let storePath = path.join(process.env.VALIDATION_FILES_ROOT_PATH,  urlHash + ".json");
            fs.writeFile(path.resolve(storePath), JSON.stringify(resJson), ()=> {});
            let validationFileObj = {
                url: url,
                hash: contentHash,
                path: `${urlHash}.json`,
                id: resJson.id
            };
            await mongodb.FHIRValidationFiles.findOneAndUpdate({
                url: url
            }, { $set: validationFileObj}, {
                upsert: true
            });
            return {
                new: true
            };
        }
        return {
            new: false
        };
    } catch(e) {
        throw e;
    }
}

/**
 * Store value set json when not exists in MongoDB.
 * @param {JSON} content 
 */
 async function fetchValueSet(content) {
    let flattenContent = flatten(content);
    let valueSetKeys = Object.keys(flattenContent).filter( 
        key=> key.includes("binding.valueSet")
    );
    for (let key of valueSetKeys) {
        let valueSetUri = _.get(content, key);
        await storeValidationFile(valueSetUri);
    }
}

/**
 * Store code system json when not exists in MongoDB.
 * @param {JSON} valueSet 
 */
async function fetchCodeSystem(valueSet) {
    let flattenValueSet= flatten(valueSet);
    let codeSystemKeys = Object.keys(flattenValueSet).filter( 
        key=> key.endsWith(".system")
    );
    for (let key of codeSystemKeys) {
        let codeSystemUri = _.get(valueSet, key);
        if (codeSystemUri.includes("CodeSystem"))
        await storeValidationFile(codeSystemUri);
    }
}

/**
 * Call C# validator API server to reload profiles.
 */
async function refreshResourceResolver() {
    try {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        }); 
        let APIUrl = new nodeUrl.URL("/api/refreshresourceresolver" , VALIDATION_API_URL).href;
        let fetchConfig = {
            method: "POST"
        };
        if (APIUrl.startsWith("https://")) fetchConfig.agent = httpsAgent;
        let fetchRes = await fetch(APIUrl, fetchConfig);
        logger.info(`[Info: Refresh C# Validator Resource Resolver] [Content: ${JSON.stringify(await fetchRes.json())}]`);
    } catch(e) {
        throw e;
    }
}

/**
 * Call C# API server to validate with profiles.
 * @param {Array<string>} profile The string array of profiles URL.
 * @param {JSON} resourceContent The FHIR resource JSON object.
 * @return {Promise<JSON>}
 */
async function validate(profile, resourceContent) {
    try {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });      
        let APIUrl = new nodeUrl.URL("/api/validate" , VALIDATION_API_URL).href;
        let body = {
            profile: profile,
            resourceJson: JSON.stringify(resourceContent)
        };
        let fetchConfig = {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'content-type': 'application/json'
            }
        };
        if (APIUrl.startsWith("https://")) fetchConfig.agent = httpsAgent;
        let fetchRes = await fetch(APIUrl, fetchConfig);
        let fetchResJson = await fetchRes.json();
        logger.info(`[Info: Call Validation function from C# successfully] [URL: ${APIUrl}]`);
        return fetchResJson;
    } catch(e) {
        throw e;
    }
}

/**
 * 
 * @param {import('express').Request} req 
 * @param {string} resourceType 
 */
 async function getValidateResult(req, resourceType) {
    try {
        let profileUrl = _.get(req.query, "profile");
        let metaProfiles = _.get(req.body, "meta.profile", false);
        if (profileUrl) {
            return await validateByProfile(profileUrl, req.body);
        } else if (metaProfiles) {
            return await validateByMetaProfile(req.body);
        }
        let validation = await mongodb[resourceType].validate(req.body);
    } catch(e) {
        let name = _.get(e, "name");
        if (name === "ValidationError") {
            let operationOutcomeError = new OperationOutcome([]);
            for (let errorKey in e.errors) {
                let error = e.errors[errorKey];
                let message = _.get(error, "message", `${error} invalid`);
                let errorIssue = new issue("error", "invalid", message);
                _.set(errorIssue, "Location", [errorKey]);
                operationOutcomeError.issue.push(errorIssue);
            }
            return operationOutcomeError;
        }
        throw e;
    }
}

module.exports.validateByProfile = validateByProfile;
module.exports.validateByMetaProfile = validateByMetaProfile;
module.exports.refreshResourceResolver = refreshResourceResolver;
module.exports.fetchValueSet = fetchValueSet;
module.exports.fetchCodeSystem = fetchCodeSystem;
module.exports.getValidateResult = getValidateResult;