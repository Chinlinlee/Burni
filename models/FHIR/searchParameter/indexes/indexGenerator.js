const {
    loadResourceTypeMap,
    resolvePathMetadata
} = require("../compiler/resourceTypeMap");
const { normalizePathForTypeResolution } = require("../compiler/extractionPathCompiler");
const {
    createTemporalIndexEntry,
    createTemporalIndexManifest
} = require("./indexManifest");

const TEMPORAL_SEARCH_TYPES = new Set(["date", "dateTime"]);

function getDefinitionRecords(input) {
    if (Array.isArray(input)) {
        return input.flatMap((definition) => getDefinitionRecordsFromDefinition(definition));
    }
    if (input?.plans && Array.isArray(input.plans)) {
        return input.plans.map((record) => ({
            definition: record.definition || {
                canonicalKey: record.canonicalKey || "",
                resource: {
                    code: record.code || ""
                }
            },
            lookupKey: record.lookupKey || `${record.resourceType}::${record.code || ""}`,
            plan: record.plan
        }));
    }
    if (input?.snapshot?.byLookupKey) {
        return [...input.snapshot.byLookupKey.entries()].map(([lookupKey, definition]) => ({
            definition,
            lookupKey,
            plan: definition.compiledPlan
        }));
    }
    return (input?.definitions || []).flatMap((definition) =>
        getDefinitionRecordsFromDefinition(definition)
    );
}

function getDefinitionRecordsFromDefinition(definition) {
    const lookupPlans = definition.lookupPlans || {};
    const records = Object.entries(lookupPlans).map(([lookupKey, lookup]) => ({
        definition,
        lookupKey,
        plan: lookup?.compilable ? lookup.plan : undefined
    }));

    if (records.length > 0) {
        return records;
    }

    if (definition.compiledPlan) {
        return [
            {
                definition,
                lookupKey:
                    definition.compiledPlan.resourceType +
                    "::" +
                    definition.compiledPlan.code,
                plan: definition.compiledPlan
            }
        ];
    }

    return [];
}

function validateExtractionPath(resourceType, extractionPath) {
    if (!extractionPath || typeof extractionPath.path !== "string") {
        return false;
    }
    const pathSegments = extractionPath.path.split(".");
    if (
        pathSegments.some(
            (segment) => segment.length === 0 || /^\d+$/.test(segment)
        )
    ) {
        return false;
    }
    const typeMap = loadResourceTypeMap(resourceType);
    if (!typeMap) {
        return false;
    }
    const normalizedPath = normalizePathForTypeResolution(extractionPath.path);
    const resolved = resolvePathMetadata(typeMap, normalizedPath);
    return (
        resolved.found &&
        resolved.datatype === extractionPath.datatype &&
        !pathSegments.some((segment) => segment.length === 0)
    );
}

function collectTemporalIndexEntries(input) {
    const entries = [];
    const diagnostics = [];

    for (const { definition, lookupKey, plan } of getDefinitionRecords(input)) {
        if (definition.effectiveStatus !== "active") {
            continue;
        }
        if (!plan || !TEMPORAL_SEARCH_TYPES.has(plan.searchType)) {
            continue;
        }

        const choicePaths =
            (plan.extractionPaths || []).length > 1
                ? plan.extractionPaths.map((entry) => entry.path)
                : [];
        for (const extractionPath of plan.extractionPaths || []) {
            if (!validateExtractionPath(plan.resourceType, extractionPath)) {
                diagnostics.push({
                    code: "invalid-temporal-extraction-path",
                    resourceType: plan.resourceType,
                    lookupKey,
                    path: extractionPath?.path || ""
                });
                continue;
            }

            const entry = createTemporalIndexEntry(
                plan.resourceType,
                definition,
                lookupKey,
                extractionPath,
                { choicePaths }
            );
            if (entry) {
                entries.push(entry);
            }
        }
    }

    return { entries, diagnostics };
}

function generateTemporalIndexManifest(input) {
    const { entries } = collectTemporalIndexEntries(input);
    return createTemporalIndexManifest(entries);
}

function generateTemporalIndexManifestWithDiagnostics(input) {
    const collected = collectTemporalIndexEntries(input);
    return {
        manifest: createTemporalIndexManifest(collected.entries),
        diagnostics: collected.diagnostics
    };
}

module.exports = {
    TEMPORAL_SEARCH_TYPES,
    getDefinitionRecords,
    validateExtractionPath,
    collectTemporalIndexEntries,
    generateTemporalIndexManifest,
    generateTemporalIndexManifestWithDiagnostics,
    buildTemporalIndexManifest: generateTemporalIndexManifest
};
