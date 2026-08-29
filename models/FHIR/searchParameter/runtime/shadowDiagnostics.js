const fs = require("fs");
const path = require("path");

/** @type {Map<string, Object>} */
const resourceSummaries = new Map();

/**
 * @param {string} resourceType
 * @returns {Object}
 */
function getResourceSummary(resourceType) {
    if (!resourceSummaries.has(resourceType)) {
        resourceSummaries.set(resourceType, {
            resourceType,
            matched: 0,
            mismatched: 0,
            legacyError: 0,
            registryError: 0,
            skipped: 0,
            entries: []
        });
    }
    return resourceSummaries.get(resourceType);
}

/**
 * @param {Object} entry
 */
function recordShadowResult(entry) {
    const summary = getResourceSummary(entry.resourceType);
    summary.entries.push(entry);
    if (entry.status === "match") {
        summary.matched += 1;
    } else if (entry.status === "mismatch") {
        summary.mismatched += 1;
    } else if (entry.status === "legacy-error") {
        summary.legacyError += 1;
    } else if (entry.status === "registry-error") {
        summary.registryError += 1;
    } else {
        summary.skipped += 1;
    }
}

/**
 * @returns {Object[]}
 */
function getAllSummaries() {
    return [...resourceSummaries.values()].map((summary) => ({
        resourceType: summary.resourceType,
        matched: summary.matched,
        mismatched: summary.mismatched,
        legacyError: summary.legacyError,
        registryError: summary.registryError,
        skipped: summary.skipped,
        total: summary.entries.length,
        readyForEnablement: false,
        shadowDiagnosticOnly: true,
    }));
}

function resetShadowDiagnostics() {
    resourceSummaries.clear();
}

/**
 * @param {string} outputPath
 */
function writeShadowReport(outputPath) {
    const summaries = getAllSummaries();
    const report = {
        generatedAt: new Date().toISOString(),
        resources: summaries,
        mismatches: summaries.flatMap((summary) =>
            resourceSummaries
                .get(summary.resourceType)
                .entries.filter((entry) => entry.status === "mismatch")
        )
    };
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    return report;
}

module.exports = {
    recordShadowResult,
    getAllSummaries,
    resetShadowDiagnostics,
    writeShadowReport,
    getResourceSummary
};
