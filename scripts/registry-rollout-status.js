require("module-alias/register");

const fs = require("fs");
const path = require("path");

const reportPath = path.join(__dirname, "../temp/search-parameter-shadow-report.json");

function main() {
    if (!fs.existsSync(reportPath)) {
        console.log("No shadow report found. Run: npm run search-parameter:shadow -- Patient");
        return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    console.log(`Shadow report generated at: ${report.generatedAt}`);
    for (const resource of report.resources) {
        const status = resource.mismatched > 0 ? "MISMATCH" : "OK";
        console.log(
            `[${status}] ${resource.resourceType}: matched=${resource.matched}, mismatched=${resource.mismatched}, legacyError=${resource.legacyError}, registryError=${resource.registryError}`
        );
    }
}

main();
