require('dotenv').config({
    path: `${process.cwd()}/.env`
});
const _ = require('lodash');
const fetch = require('node-fetch');
const mongodb = require('../mongodb');
const hash = require('object-hash');
const fs = require('fs');
const { fetchCodeSystem, fetchValueSet, refreshResourceResolver } = require('./fhir-validator');
const { logger } = require('../../utils/log');
const path = require('path');
const PWD_FILENAME = path.relative(process.cwd(), __filename);
const schedule = require('node-schedule');

/**
 * Store StructureDefinition, ValueSet, CodeSystem json when not exists in MongoDB.
 * @param {JSON} structureDefinition
 */
 async function updateValidationFile(url, resJson, contentHash) {
    try {
        if (resJson.resourceType === "StructureDefinition") {
            await fetchValueSet(resJson);
        } else if (resJson.resourceType === "ValueSet") {
            await fetchCodeSystem(resJson);
        }
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
    } catch(e) {
        throw e;
    }
}

async function iterateUpdateValidationFiles() {
    try {
        let validationFiles = await mongodb.FHIRValidationFiles.find({}).limit(10);
        while(validationFiles.length > 0) {
            for(let validationFileObj of validationFiles) {
                let url = validationFileObj.url;
                logger.info(`[Info: Fetch Profile From URL: ${url}]`);
                let fetchRes = await fetch(url, {
                    headers: {
                        "accept": "application/fhir+json"
                    }
                });
                let resJson = await fetchRes.json();
                let contentHash = hash(resJson);
                if (validationFileObj.hash != contentHash) {
                    await updateValidationFile(url, resJson, contentHash);
                }
            }
            let lastId = validationFiles[validationFiles.length - 1]._id;
            validationFiles = await mongodb.FHIRValidationFiles.find({
                _id: {
                    $gt: lastId
                }
            })
            .limit(10);
        }
    } catch(e) {
        logger.error(e);
    }
}

const updateValidationFileJob = schedule.scheduleJob('0 0 0 * *', async function(){
    await iterateUpdateValidationFiles();
    await refreshResourceResolver();
});