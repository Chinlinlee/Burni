"use strict";

async function searchParameterRegistryReadinessStep() {
    const { reloadRegistry } = require("../FHIR/searchParameter/registry/registryManager");
    return reloadRegistry();
}

module.exports = {
    searchParameterRegistryReadinessStep
};
