const _ = require('lodash');
const fetch = require('node-fetch');
const FHIR = require('../../models/FHIR/fhir/fhir').Fhir;
const fhirVersions = require('../../models/FHIR/fhir/fhir').Versions;
const ParseConformance = require('../../models/FHIR/fhir/parseConformance').ParseConformance;
const { handleError, issue, OperationOutcome } = require('../../models/FHIR/httpMessage');
const { getDeepKeys } = require('../apiService');
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {string} resourceType
 * @returns 
 */
module.exports = async function (req, res, resourceType) {
    let doRes = function (code, item) {
        if (res.getHeader("content-type").includes("xml")) {
            let fhir = new FHIR();
            let xmlItem = fhir.objToXml(item);
            return res.status(code).send(xmlItem);
        }
        return res.status(code).send(item);
    }
    let operationOutcomeMessage;
    let query = req.query;
    let resourceBody = req.body;
    let profile = _.get(query, "profile");
    if (profile) {
        try {
            let fetchProfileRes = await fetch(profile, {
                headers: {
                    "accept": "application/fhir+json"
                }
            });
            let profileJson = await fetchProfileRes.json();
            _.set(profileJson, "id", resourceType);
            let parser = new ParseConformance(true, fhirVersions.R4);

            let valueSetKeys =
                getDeepKeys(profileJson)
                    .filter(v =>
                        v.includes("binding.valueSet") //&&
                        //v.includes("snapshot")
                    )
            let parsedValueSetsKeys = Object.keys(parser.parsedValueSets);
            for (let key of valueSetKeys) {
                let valueSetUri = _.get(profileJson, key)
                if (!parsedValueSetsKeys.includes(valueSetUri)) {
                    console.log(`Get valueSet from "${valueSetUri}"`)
                    let valueSetRes = await fetch(valueSetUri, {
                        headers: {
                            "accept": "application/fhir+json"
                        }
                    });
                    let valueSetJson = await valueSetRes.json();
                    console.log(`Load valueSet "${valueSetJson.id}"`);
                    parser.parseValueSet(valueSetJson);
                    console.log(`Success parse valuset "${valueSetJson.id}"`)
                }
            }

            parser.parseStructureDefinition(profileJson);
            console.log(parser.parsedStructureDefinitions[resourceType]);
            let fhir = new FHIR(parser);
            let validation = fhir.validate(resourceBody);
            if (validation.messages.length > 0) {
                let issueList = [];
                for (let message of validation.messages) {
                    let issueObj = new issue(message.severity, "processing", message.message);
                    _.set(issueObj, "location", [message.location]);
                    issueList.push(issueObj);
                }
                let operationOutcomeError = new OperationOutcome(issueList);
                if (validation.messages.find(v => v.severity == "error")) {
                    operationOutcomeMessage = {
                        code: 412,
                        msg: operationOutcomeError
                    }
                } else {
                    operationOutcomeMessage = {
                        code: 200,
                        msg: operationOutcomeError
                    }
                }
            } else {
                let operationOutcomeInfo = handleError.informational("No issues detected during validation")
                operationOutcomeMessage = {
                    code: 200,
                    msg: operationOutcomeInfo
                }
            }
        } catch (e) {
            console.error(e);
            operationOutcomeMessage = {
                code: 500,
                msg: handleError.exception(e)
            }
        }
    } else {
        let fhir = new FHIR();
        let validation = fhir.validate(resourceBody);
        if (validation.messages.length > 0) {
            for (let message of validation.messages) {
                let issueObj = new issue(message.severity, "processing", message.message);
                _.set(issueObj, "Location", [message.location]);
                let operationOutcomeError = new OperationOutcome(issueObj);
                operationOutcomeMessage = {
                    code: 412,
                    msg: operationOutcomeError
                }
            }
        } else {
            let operationOutcomeInfo = handleError.informational("No issues detected during validation");
            operationOutcomeMessage = {
                code: 200,
                msg: operationOutcomeInfo
            }
        }
    }
    return doRes(operationOutcomeMessage.code, operationOutcomeMessage.msg);
}