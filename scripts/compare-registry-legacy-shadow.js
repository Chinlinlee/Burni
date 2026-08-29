require("module-alias/register");

const fs = require("fs");
const path = require("path");
const legacyParameters = require("@root/api_generator/FHIRParametersClean.json");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { compareWithLegacyHandler, getSampleValue } = require("@models/FHIR/searchParameter/runtime/shadowComparison");
const {
    resetShadowDiagnostics,
    writeShadowReport,
    getAllSummaries
} = require("@models/FHIR/searchParameter/runtime/shadowDiagnostics");

const resourceTypes = process.argv.slice(2);
const outputPath = path.join(
    __dirname,
    "../temp/search-parameter-shadow-report.json"
);

/**
 * @param {string} resourceType
 * @returns {{ paramsSearch: Record<string, Function> } | null}
 */
function loadLegacyHandler(resourceType) {
    const handlerPath = path.join(
        __dirname,
        `../api/FHIR/${resourceType}/${resourceType}ParametersHandler.js`
    );
    if (!fs.existsSync(handlerPath)) {
        return null;
    }
    return require(handlerPath);
}

async function compareResource(resourceType, snapshot) {
    const legacyHandler = loadLegacyHandler(resourceType);
    const legacyParams = legacyParameters[resourceType] || [];
    if (!legacyHandler) {
        return {
            resourceType,
            skipped: true,
            reason: "Legacy handler is not generated"
        };
    }

    for (const legacyParam of legacyParams) {
        const parameterName = legacyParam.parameter;
        const lookupKey = `${resourceType}::${parameterName}`;
        const definition = snapshot.byLookupKey.get(lookupKey);
        if (!definition?.compiledPlan) {
            continue;
        }

        await compareWithLegacyHandler({
            resourceType,
            parameterName,
            queryValue: getSampleValue(
                definition.compiledPlan.searchType,
                parameterName
            ),
            paramsSearch: legacyHandler.paramsSearch,
            plan: definition.compiledPlan,
            source: "batch"
        });
    }

    return getAllSummaries().find((summary) => summary.resourceType === resourceType);
}

async function main() {
    resetShadowDiagnostics();
    const snapshot = await reloadRegistry();
    const targets =
        resourceTypes.length > 0
            ? resourceTypes
            : Object.keys(legacyParameters);

    for (const resourceType of targets) {
        await compareResource(resourceType, snapshot);
    }

    const report = writeShadowReport(outputPath);
    const ready = report.resources.filter((resource) => resource.readyForEnablement);
    const blocked = report.resources.filter(
        (resource) => resource.total > 0 && resource.mismatched > 0
    );

    console.log(`Wrote shadow report to ${outputPath}`);
    console.log(
        `Shadow diagnostics only — enablement uses projection golden + document fixture tests.`
    );
    console.log(
        `Matched (${report.resources.filter((resource) => resource.matched > 0).length}): ${
            report.resources
                .filter((resource) => resource.matched > 0)
                .map((item) => item.resourceType)
                .join(", ") || "(none)"
        }`
    );
    console.log(
        `Mismatched vs legacy (${blocked.length}): ${blocked.map((item) => item.resourceType).join(", ") || "(none)"}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
