require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const {
    buildRegistryIntegrityReport
} = require("@models/FHIR/searchParameter/migration/registryIntegrityReport");

const outputPath = path.join(__dirname, "../temp/search-parameter-diagnostics-report.json");

async function main() {
    const snapshot = await reloadRegistry();
    const report = buildRegistryIntegrityReport({
        snapshot,
        definitions: [...snapshot.byCanonicalKey.values()]
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`Wrote registry integrity report to ${outputPath}`);
    console.log(`Definitions: ${report.summary.definitionCount}`);
    console.log(`Resources: ${report.summary.resourceCount}`);
    console.log(`Lookups: ${report.summary.lookupCount}`);
    console.log(`Compiled: ${report.summary.compiled}`);
    console.log(`Disabled: ${report.summary.disabled}`);
    console.log(`Unsupported: ${report.summary.unsupported}`);
    console.log(`No-lookup resources: ${report.summary.noLookupResources.length}`);
    console.log(`Enabled resources: ${report.summary.enabledResources}`);
    console.log(`Conflicts: ${report.summary.conflictCount}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
