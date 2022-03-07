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
const PWD_FILENAME = path.relative(process.cwd(), __filename);
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
        if (metaProfile) {
            for (let i = 0 ; i< metaProfile.length; i++) {
                let profileUrl = metaProfile[i];
                await storeValidationFile(profileUrl);
            }
            await refreshResourceResolver();
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
            let storePath = path.join(process.env.VALIDATION_FILES_ROOT_PATH, hash({url:url}) + ".json");
            fs.writeFile(path.resolve(storePath), JSON.stringify(resJson), ()=> {});
            let validationFileObj = {
                url: url,
                hash: contentHash,
                path: storePath,
                id: resJson.id
            };
            await mongodb.FHIRValidationFiles.findOneAndUpdate({
                url: url
            }, { $set: validationFileObj}, {
                upsert: true
            });
        }
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
        let fetchRes = await fetch(APIUrl, {
            method: "POST",
            agent: httpsAgent
        });
        logger.info(`[Info: Refresh C# Validator Resource Resolver] [Content: ${JSON.stringify(await fetchRes.json())}]`);
    } catch(e) {
        throw e;
    }
}

/**
 * Call C# API server to validate with profiles.
 * @param {Array<string>} profile The string array of profiles URL.
 * @param {JSON} resourceContent The FHIR resource JSON object.
 * @return {JSON}
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
        let fetchRes = await fetch(APIUrl, {
            method: "POST",
            body: JSON.stringify(body),
            agent: httpsAgent,
            headers: {
                'content-type': 'application/json'
            }
        });
        let fetchResJson = await fetchRes.json();
        logger.info(`[Info: Call Validation function from C# successfully] [URL: ${APIUrl}]`);
        return fetchResJson;
    } catch(e) {
        throw e;
    }
}

module.exports.validateByProfile = validateByProfile;
module.exports.validateByMetaProfile = validateByMetaProfile;
module.exports.refreshResourceResolver = refreshResourceResolver;
module.exports.fetchValueSet = fetchValueSet;
module.exports.fetchCodeSystem = fetchCodeSystem;