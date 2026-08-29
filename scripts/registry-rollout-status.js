require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { loadRolloutConfig, ROLLOUT_CONFIG_PATH } = require("@models/FHIR/searchParameter/config/featureFlags");

const reportPath = path.join(__dirname, "../temp/search-parameter-shadow-report.json");

function main() {
    const rollout = loadRolloutConfig();
    console.log("Registry rollout config:", ROLLOUT_CONFIG_PATH);
    console.log("Enabled:", rollout.enabledResourceTypes.join(", ") || "(none)");
    console.log("Shadow compare:", rollout.shadowCompareResourceTypes.join(", ") || "(none)");

    if (!fs.existsSync(reportPath)) {
        console.log("\nNo shadow report found. Run: npm run search-parameter:shadow -- Patient");
        return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    console.log(`\nShadow report generated at: ${report.generatedAt}`);
    for (const resource of report.resources) {
        const status = resource.mismatched > 0 ? "MISMATCH" : "OK";
        console.log(
            `[${status}] ${resource.resourceType}: matched=${resource.matched}, mismatched=${resource.mismatched}, legacyError=${resource.legacyError}, registryError=${resource.registryError}`
        );
    }
}

main();
