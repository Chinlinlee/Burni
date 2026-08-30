const { execFileSync } = require("child_process");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "../../..");
const SCENARIO_RUNNER = path.join(__dirname, "run-isolated-connector-scenario.js");

/**
 * Runs a connector lifecycle scenario in an isolated child process so module-level
 * singleton state does not leak between scenarios.
 *
 * @param {string} scenarioName
 * @param {Record<string, string | undefined>} [envOverrides]
 * @returns {Record<string, unknown>}
 */
function runIsolatedConnectorScenario(scenarioName, envOverrides = {}) {
    const stdout = execFileSync(process.execPath, [SCENARIO_RUNNER, scenarioName], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        env: {
            ...process.env,
            ...envOverrides
        },
        timeout: 180000,
        stdio: ["ignore", "pipe", "pipe"]
    });

    const marker = "__CONNECTOR_LIFECYCLE_RESULT__";
    const markerIndex = stdout.lastIndexOf(marker);
    if (markerIndex === -1) {
        throw new Error(
            `Scenario "${scenarioName}" did not emit a result marker.\n${stdout}`
        );
    }

    return JSON.parse(stdout.slice(markerIndex + marker.length).trim());
}

module.exports = {
    runIsolatedConnectorScenario
};
