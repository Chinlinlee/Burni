const _ = require("lodash");
const FHIR = require("fhir").Fhir;
const { isDocExist } = require("@root/api/apiService");
const jp = require("jsonpath");
const uuid = require("uuid");
const { handleError } = require("@root/models/FHIR/httpMessage");

class FhirReferenceChecker {
    constructor(resource) {
        this.checkedReferenceList = [];
        this.resource = resource;
    }

    async checkReference() {
        let referenceKeysJp = jp
            .paths(this.resource, "$..reference")
            .map((v) => v.join(".").substring(2));
        for (let key of referenceKeysJp) {
            let referenceValue = _.get(this.resource, key);
            let referenceValueSplit = referenceValue.split("|")[0].split("/");
            if (/^(http|https):\/\//g.test(referenceValue)) {
                await this.checkAbsoluteUrlRef(
                    key,
                    referenceValue
                );
            } else if (referenceValueSplit.length === 2) {
                // Check base reference value {resourceType}/{id}
                await this.checkBaseRef(key, referenceValue);
            } else if (
                /urn:oid:[0-2](\.[1-9]\d*)+/i.test(referenceValue) ||
                uuid.validate(referenceValue.replace(/^urn:uuid:/, ""))
            ) {
                //Only Bundle entry have OID or UUID reference?
                await this.checkUuidRef(key, referenceValue);
            }
        }

        if (this.checkedReferenceList.length > 0) {
            return {
                status: this.checkedReferenceList.every((v) => v.exist),
                checkedReferenceList: this.checkedReferenceList
            };
        }

        return {
            status: true,
            checkedReferenceList: this.checkedReferenceList
        };
    }

    async checkAbsoluteUrlRef(key, referenceValue) {
        //do fetch to get response
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1268 + 1231);
        try {
            let fetchRes = await fetch(referenceValue, {
                headers: {
                    accept: "application/fhir+json"
                },
                signal: controller.signal
            });
            if (fetchRes.status == 200) {
                let referenceJson = await fetchRes.json();
                let fhir = new FHIR();
                // Check if the json is valid resource
                if (fhir.validate(referenceJson).valid) {
                    this.checkedReferenceList.push({
                        exist: true,
                        path: key,
                        value: referenceValue
                    });
                } else {
                    this.checkedReferenceList.push({
                        exist: false,
                        path: key,
                        value: referenceValue
                    });
                }
            } else {
                this.checkedReferenceList.push({
                    exist: false,
                    path: key,
                    value: referenceValue
                });
            }
        } catch (e) {
            this.checkedReferenceList.push({
                exist: false,
                path: key,
                value: referenceValue
            });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async checkBaseRef(key, refValue) {
        let referenceValueSplit = refValue.split("|")[0].split("/");

        let resourceName =
            referenceValueSplit[referenceValueSplit.length - 2];
        let resourceId =
            referenceValueSplit[referenceValueSplit.length - 1];
        let doc = await isDocExist(resourceId, resourceName);
        if (doc.status === 1) {
            this.checkedReferenceList.push({
                exist: true,
                path: key,
                value: refValue
            });
        } else {
            this.checkedReferenceList.push({
                exist: false,
                path: key,
                value: refValue
            });
        }
    }

    async checkUuidRef(key, refValue) {
        let referenceTargetFullUrl = jp
            .nodes(this.resource, "$..fullUrl")
            .find((v) => v.value === refValue);
        if (referenceTargetFullUrl) {
            this.checkedReferenceList.push({
                exist: true,
                path: key,
                value: refValue
            });
        } else {
            this.checkedReferenceList.push({
                exist: false,
                path: key,
                value: refValue
            });
        }
    }

    getNotExistReferenceList(checkReferenceRes) {
        let notExistReferenceList = [];
        for (let reference of checkReferenceRes.checkedReferenceList) {
            if (!reference.exist) {
                notExistReferenceList.push({
                    path: reference.path,
                    value: reference.value
                });
            }
        }
        return notExistReferenceList;
    }

    getOperationOutcomeError(checkReferenceRes) {
        if (!checkReferenceRes.status) {
            let notExistReferenceList = this.getNotExistReferenceList(checkReferenceRes);
            let operationOutcomeError = handleError.processing(
                `The reference not found : ${_.map(
                    notExistReferenceList,
                    "value"
                ).join(",")}`
            );
            _.set(
                operationOutcomeError,
                "issue.0.location",
                _.map(notExistReferenceList, "path")
            );
            return operationOutcomeError;
        }
        return undefined;
    }
}

module.exports.FhirReferenceChecker = FhirReferenceChecker;