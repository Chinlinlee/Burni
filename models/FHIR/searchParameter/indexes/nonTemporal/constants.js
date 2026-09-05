"use strict";

const NON_TEMPORAL_POLICY_VERSION = "1.0.0";
const NON_TEMPORAL_MANIFEST_KIND = "fhir-searchparameter-derived-index-manifest";
const NON_TEMPORAL_MANIFEST_VERSION = 1;

const NON_TEMPORAL_SEARCH_TYPES = Object.freeze([
    "token",
    "reference",
    "string",
    "number",
    "quantity",
    "uri"
]);

const UNSUPPORTED_NUMBER_QUANTITY_COMPARATORS = Object.freeze(["sa", "eb", "ap"]);

const INDEX_NAME_PREFIX = "fhir_sp";

const ADDRESS_STRING_FIELDS = Object.freeze([
    "line",
    "city",
    "district",
    "state",
    "postalCode",
    "country"
]);

const HUMAN_NAME_STRING_FIELDS = Object.freeze([
    "text",
    "family",
    "given",
    "prefix",
    "suffix"
]);

module.exports = {
    NON_TEMPORAL_POLICY_VERSION,
    NON_TEMPORAL_MANIFEST_KIND,
    NON_TEMPORAL_MANIFEST_VERSION,
    NON_TEMPORAL_SEARCH_TYPES,
    UNSUPPORTED_NUMBER_QUANTITY_COMPARATORS,
    INDEX_NAME_PREFIX,
    ADDRESS_STRING_FIELDS,
    HUMAN_NAME_STRING_FIELDS
};
