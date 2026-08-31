const crypto = require("crypto");

const TEMPORAL_DATATYPES = new Set(["date", "dateTime", "instant", "Period"]);

function getTemporalIndexSpec(extractionPath) {
    if (!extractionPath || typeof extractionPath.path !== "string") {
        return null;
    }

    const { path, datatype } = extractionPath;
    if (!path || !TEMPORAL_DATATYPES.has(datatype)) {
        return null;
    }

    if (datatype === "date") {
        return {
            indexKind: "date-calendar-boundary",
            fields: [`${path}.normalizedStart`, `${path}.normalizedEnd`],
            bsonType: "string",
            valueShape: "calendar-boundary"
        };
    }

    if (datatype === "dateTime") {
        return {
            indexKind: "dateTime-decimal-boundary",
            fields: [`${path}.normalizedStart`, `${path}.normalizedEnd`],
            bsonType: "decimal",
            valueShape: "decimal-boundary"
        };
    }

    if (datatype === "instant") {
        return {
            indexKind: "instant-epoch",
            fields: [`${path}.epochSeconds`],
            bsonType: "decimal",
            valueShape: "epoch-seconds"
        };
    }

    return {
        indexKind: "period-dateTime-boundary",
        fields: [`${path}.start.normalizedStart`, `${path}.end.normalizedEnd`],
        bsonType: "decimal",
        valueShape: "period-interval"
    };
}

function getIndexIdentity(entry) {
    return JSON.stringify({
        resourceType: entry.resourceType,
        extractionPath: entry.extractionPath,
        datatype: entry.datatype,
        indexKind: entry.indexKind,
        fields: entry.fields
    });
}

function buildIndexName(identity) {
    const digest = crypto.createHash("sha256").update(identity).digest("hex").slice(0, 20);
    return `fhir_temporal_${digest}`;
}

function buildCompatibilityMetadata(extractionPath, datatype, options = {}) {
    const arrayPaths = [...new Set(extractionPath.arrayPaths || [])].sort();
    const isPeriod = datatype === "Period";
    const requiresElementCorrelation = arrayPaths.length > 0;
    const choicePaths = [...new Set(options.choicePaths || [])].sort();

    return {
        arrayPaths,
        isPeriod,
        requiresElementCorrelation,
        ...(choicePaths.length > 1
            ? {
                  choice: {
                      kind: "alternative-branches",
                      paths: choicePaths,
                      compound: false
                  }
              }
            : {}),
        mongo: {
            status: isPeriod || requiresElementCorrelation ? "requires-validation" : "candidate",
            explain: "deferred-to-7.2"
        }
    };
}

function createTemporalIndexEntry(
    resourceType,
    definition,
    lookupKey,
    extractionPath,
    options = {}
) {
    const spec = getTemporalIndexSpec(extractionPath);
    if (!spec) {
        return null;
    }

    const entry = {
        resourceType,
        extractionPath: extractionPath.path,
        datatype: extractionPath.datatype,
        indexKind: spec.indexKind,
        fields: spec.fields,
        key: Object.fromEntries(spec.fields.map((field) => [field, 1])),
        bsonType: spec.bsonType,
        valueShape: spec.valueShape,
        compatibility: buildCompatibilityMetadata(extractionPath, extractionPath.datatype, options),
        sources: {
            lookupKeys: [lookupKey],
            canonicalKeys: [definition.canonicalKey],
            codes: [definition.resource.code || ""]
        }
    };

    const identity = getIndexIdentity(entry);
    return {
        ...entry,
        name: buildIndexName(identity)
    };
}

function mergeIndexSources(existing, next) {
    return {
        ...existing,
        sources: {
            lookupKeys: [...new Set([...existing.sources.lookupKeys, ...next.sources.lookupKeys])].sort(),
            canonicalKeys: [
                ...new Set([...existing.sources.canonicalKeys, ...next.sources.canonicalKeys])
            ].sort(),
            codes: [...new Set([...existing.sources.codes, ...next.sources.codes])].sort()
        }
    };
}

function sortManifestIndexes(indexes) {
    return [...indexes].sort((left, right) => {
        const leftIdentity = getIndexIdentity(left);
        const rightIdentity = getIndexIdentity(right);
        return leftIdentity.localeCompare(rightIdentity);
    });
}

function createTemporalIndexManifest(indexes = []) {
    const byIdentity = new Map();
    for (const index of indexes) {
        const identity = getIndexIdentity(index);
        const existing = byIdentity.get(identity);
        byIdentity.set(identity, existing ? mergeIndexSources(existing, index) : index);
    }

    const sortedIndexes = sortManifestIndexes([...byIdentity.values()]);
    return {
        version: 1,
        kind: "fhir-temporal-index-manifest",
        indexes: sortedIndexes,
        indexCount: sortedIndexes.length
    };
}

module.exports = {
    TEMPORAL_DATATYPES,
    getTemporalIndexSpec,
    getIndexIdentity,
    buildIndexName,
    createTemporalIndexEntry,
    createTemporalIndexManifest,
    sortManifestIndexes
};
