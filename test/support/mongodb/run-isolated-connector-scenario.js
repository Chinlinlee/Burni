"use strict";

require("module-alias/register");

const scenarios = require("./connector-lifecycle-scenarios");

const scenarioName = process.argv[2];
const marker = "__CONNECTOR_LIFECYCLE_RESULT__";

async function main() {
    if (!scenarioName || !scenarios[scenarioName]) {
        throw new Error(`Unknown connector lifecycle scenario: ${scenarioName}`);
    }

    const result = await scenarios[scenarioName]();
    process.stdout.write(`${marker}${JSON.stringify(result)}`);
}

main().catch((err) => {
    process.stdout.write(
        `${marker}${JSON.stringify({
            ok: false,
            error: {
                name: err.name,
                message: err.message
            }
        })}`
    );
    process.exitCode = 1;
});
