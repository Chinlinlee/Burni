const {
    getIndexIdentity,
    getTemporalIndexSpec,
    buildIndexName
} = require("./indexManifest");
const { loadResourceTypeMap, resolvePathMetadata } = require("../compiler/resourceTypeMap");

function normalizePathForValidation(path) {
    return path
        .split(".")
        .filter((segment) => !/^\d+$/.test(segment))
        .join(".");
}

function validateExtractionPathMetadata(entry) {
    if (
        !entry ||
        typeof entry.resourceType !== "string" ||
        typeof entry.extractionPath !== "string" ||
        entry.extractionPath.length === 0
    ) {
        return {
            valid: false,
            reason: "Temporal index extraction path metadata is incomplete"
        };
    }

    const typeMap = loadResourceTypeMap(entry.resourceType);
    if (!typeMap) {
        return {
            valid: false,
            reason: `Resource type map not found for ${entry.resourceType}`
        };
    }

    const resolved = resolvePathMetadata(
        typeMap,
        normalizePathForValidation(entry.extractionPath)
    );
    if (!resolved.found || resolved.datatype !== entry.datatype) {
        return {
            valid: false,
            reason: `Temporal index extraction path does not resolve to ${entry.datatype}: ${entry.extractionPath}`
        };
    }
    if (entry.extractionPath.split(".").some((segment) => segment.length === 0)) {
        return {
            valid: false,
            reason: `Temporal index extraction path is malformed: ${entry.extractionPath}`
        };
    }
    return { valid: true };
}

function getPlanCandidate(candidate) {
    if (candidate?.plan && typeof candidate.plan === "object") {
        return candidate.plan;
    }
    return candidate;
}

function getPlanLookupKeys(candidate, plan) {
    return [
        candidate?.lookupKey,
        plan?.resourceType && plan?.code
            ? `${plan.resourceType}::${plan.code}`
            : undefined
    ].filter((key) => typeof key === "string");
}

function planMatchesIndexEntry(candidate, entry) {
    const plan = getPlanCandidate(candidate);
    if (
        !plan ||
        typeof plan.resourceType !== "string" ||
        plan.resourceType !== entry.resourceType ||
        !Array.isArray(plan.extractionPaths)
    ) {
        return false;
    }

    const entryLookupKeys = [
        entry.lookupKey,
        ...(Array.isArray(entry.sources?.lookupKeys) ? entry.sources.lookupKeys : [])
    ].filter((key) => typeof key === "string");
    const planLookupKeys = getPlanLookupKeys(candidate, plan);
    if (
        entryLookupKeys.length === 0 ||
        !entryLookupKeys.some((key) => planLookupKeys.includes(key))
    ) {
        return false;
    }

    return plan.extractionPaths.some(
        (extractionPath) =>
            extractionPath?.path === entry.extractionPath &&
            extractionPath?.datatype === entry.datatype
    );
}

function validateTemporalIndexEntryMetadata(entry, options = {}) {
    const errors = [];
    const pathValidator = options.pathValidator || validateExtractionPathMetadata;
    const pathResult = pathValidator(entry);
    if (pathResult !== true && pathResult?.valid !== true) {
        errors.push(
            pathResult?.reason ||
                `Temporal index extraction path is invalid: ${entry?.extractionPath || ""}`
        );
    }

    if (options.requirePlans === true) {
        const plans = Array.isArray(options.plans) ? options.plans : [];
        if (!plans.some((candidate) => planMatchesIndexEntry(candidate, entry))) {
            errors.push(
                `Temporal index extraction path is not present in a compiled SearchParameter plan: ${entry?.extractionPath || ""}`
            );
        }
    }

    return { valid: errors.length === 0, errors };
}

function isPathWithin(path, parentPath) {
    return path === parentPath || path.startsWith(`${parentPath}.`);
}

function getIndexedArrayPath(field, arrayPaths) {
    return arrayPaths
        .filter((arrayPath) => isPathWithin(field, arrayPath))
        .sort((left, right) => right.length - left.length)[0];
}

function validateTemporalIndexEntryCompatibility(entry) {
    const diagnostics = [];
    const spec = getTemporalIndexSpec({
        path: entry?.extractionPath,
        datatype: entry?.datatype
    });

    if (!entry || !spec) {
        diagnostics.push({
            code: "unsupported-temporal-index-shape",
            message: "Temporal index entry has no supported canonical shape",
            extractionPath: entry?.extractionPath || ""
        });
        return { valid: false, diagnostics };
    }

    const expectedKey = Object.fromEntries(spec.fields.map((field) => [field, 1]));
    if (JSON.stringify(entry.key) !== JSON.stringify(expectedKey)) {
        diagnostics.push({
            code: "temporal-index-key-mismatch",
            message: `Temporal index key does not match ${entry.extractionPath}`,
            extractionPath: entry.extractionPath
        });
    }

    if (entry.bsonType !== spec.bsonType) {
        diagnostics.push({
            code: "temporal-index-bson-type-mismatch",
            message: `Temporal index BSON type does not match ${entry.extractionPath}`,
            extractionPath: entry.extractionPath,
            expectedBsonType: spec.bsonType,
            actualBsonType: entry.bsonType
        });
    }

    const declaredArrayPaths = Array.isArray(entry.compatibility?.arrayPaths)
        ? entry.compatibility.arrayPaths
        : [];
    const arrayPaths = [...new Set(declaredArrayPaths)].filter(
        (arrayPath) => typeof arrayPath === "string" && arrayPath.length > 0
    );
    const invalidArrayPaths = arrayPaths.filter(
        (arrayPath) => !isPathWithin(entry.extractionPath, arrayPath)
    );
    if (invalidArrayPaths.length > 0) {
        diagnostics.push({
            code: "temporal-index-array-path-mismatch",
            message: `Array path is not an ancestor of ${entry.extractionPath}`,
            extractionPath: entry.extractionPath,
            arrayPaths: invalidArrayPaths
        });
    }

    const independentArrayPaths = arrayPaths.filter(
        (arrayPath, index) =>
            !arrayPaths.some(
                (otherPath, otherIndex) =>
                    index !== otherIndex && isPathWithin(arrayPath, otherPath)
            )
    );
    if (independentArrayPaths.length > 1) {
        diagnostics.push({
            code: "parallel-multikey-paths",
            message: `Temporal compound index crosses independent multikey paths for ${entry.extractionPath}`,
            extractionPath: entry.extractionPath,
            arrayPaths: independentArrayPaths
        });
    }

    const indexedArrayPaths = spec.fields
        .map((field) => getIndexedArrayPath(field, arrayPaths))
        .filter(Boolean);
    if (new Set(indexedArrayPaths).size > 1) {
        diagnostics.push({
            code: "parallel-multikey-index-fields",
            message: `Temporal compound index fields use different multikey paths for ${entry.extractionPath}`,
            extractionPath: entry.extractionPath,
            indexedArrayPaths
        });
    }

    if (entry.extractionPath.split(".").some((segment) => /^\d+$/.test(segment))) {
        diagnostics.push({
            code: "numeric-array-index-unsupported",
            message: `Temporal index cannot target a positional array path: ${entry.extractionPath}`,
            extractionPath: entry.extractionPath
        });
    }

    return { valid: diagnostics.length === 0, diagnostics };
}

function validateTemporalIndexManifest(manifest, options = {}) {
    const errors = [];
    if (!manifest || manifest.kind !== "fhir-temporal-index-manifest") {
        errors.push("Invalid temporal index manifest kind");
    }
    if (manifest?.version !== 1) {
        errors.push("Unsupported temporal index manifest version");
    }
    if (!Array.isArray(manifest?.indexes)) {
        errors.push("Temporal index manifest indexes must be an array");
        return { valid: false, errors };
    }
    if (manifest.indexCount !== manifest.indexes.length) {
        errors.push("Temporal index manifest indexCount does not match indexes");
    }
    const plans = Array.isArray(options.plans) ? options.plans : [];
    if (options.requirePlans === true && plans.length === 0) {
        errors.push("Temporal index manifest plan validation requires compiled plans");
    }
    if (options.requirePlans === true) {
        const temporalPlans = plans
            .map((candidate) => getPlanCandidate(candidate))
            .filter(
                (plan) =>
                    plan?.searchType === "date" || plan?.searchType === "dateTime"
            );
        if (temporalPlans.length === 0) {
            errors.push(
                "Temporal index manifest plan validation requires non-empty compiled temporal plans"
            );
        } else if (
            temporalPlans.some(
                (plan) =>
                    typeof plan.resourceType !== "string" ||
                    typeof plan.code !== "string" ||
                    !Array.isArray(plan.extractionPaths) ||
                    plan.extractionPaths.length === 0
            )
        ) {
            errors.push(
                "Temporal index manifest plan validation found an empty compiled temporal plan"
            );
        }
    }

    const identities = new Set();
    const names = new Set();
    for (const entry of manifest.indexes) {
        const spec = getTemporalIndexSpec({
            path: entry?.extractionPath,
            datatype: entry?.datatype
        });
        if (!entry || !spec) {
            errors.push("Temporal index entry has an unsupported temporal shape");
            continue;
        }
        errors.push(
            ...validateTemporalIndexEntryMetadata(entry, {
                ...options,
                plans
            }).errors
        );

        const identity = getIndexIdentity(entry);
        if (identities.has(identity)) {
            errors.push(`Duplicate temporal index identity: ${identity}`);
        }
        identities.add(identity);

        const expectedName = buildIndexName(identity);
        if (entry.name !== expectedName) {
            errors.push(`Temporal index has a non-deterministic name: ${entry.name}`);
        }
        if (names.has(entry.name)) {
            errors.push(`Duplicate temporal index name: ${entry.name}`);
        }
        names.add(entry.name);

        if (!entry.resourceType || !entry.lookupKey && !entry.sources) {
            errors.push("Temporal index entry is missing source identity");
        }
        if (entry.indexKind !== spec.indexKind) {
            errors.push(`Temporal index kind does not match ${entry.extractionPath}`);
        }
        if (JSON.stringify(entry.fields) !== JSON.stringify(spec.fields)) {
            errors.push(`Temporal index fields do not match ${entry.extractionPath}`);
        }
        if (entry.bsonType !== spec.bsonType || entry.valueShape !== spec.valueShape) {
            errors.push(`Temporal index BSON metadata does not match ${entry.extractionPath}`);
        }

        const expectedKey = Object.fromEntries(spec.fields.map((field) => [field, 1]));
        if (JSON.stringify(entry.key) !== JSON.stringify(expectedKey)) {
            errors.push(`Temporal index key does not match ${entry.extractionPath}`);
        }
        if (spec.fields.some((field) => field === "value" || field.endsWith(".value"))) {
            errors.push(`Temporal index points to a raw FHIR value: ${entry.extractionPath}`);
        }

        const compatibility = entry.compatibility;
        if (
            !compatibility ||
            !Array.isArray(compatibility.arrayPaths) ||
            typeof compatibility.requiresElementCorrelation !== "boolean" ||
            !compatibility.mongo
        ) {
            errors.push(`Temporal index is missing compatibility metadata: ${entry.extractionPath}`);
        }
        if (compatibility?.choice) {
            if (
                compatibility.choice.kind !== "alternative-branches" ||
                !Array.isArray(compatibility.choice.paths) ||
                compatibility.choice.paths.length < 2 ||
                compatibility.choice.compound !== false ||
                !compatibility.choice.paths.includes(entry.extractionPath)
            ) {
                errors.push(`Temporal choice metadata is invalid: ${entry.extractionPath}`);
            }
        }
        errors.push(
            ...validateTemporalIndexEntryCompatibility(entry).diagnostics.map(
                (diagnostic) => diagnostic.message
            )
        );
    }

    return { valid: errors.length === 0, errors };
}

function assertTemporalIndexManifest(manifest, options = {}) {
    const result = validateTemporalIndexManifest(manifest, options);
    if (!result.valid) {
        throw new Error(result.errors.join("; "));
    }
    return manifest;
}

module.exports = {
    validateTemporalIndexManifest,
    validateIndexManifest: validateTemporalIndexManifest,
    assertTemporalIndexManifest,
    validateTemporalIndexEntryCompatibility,
    validateTemporalIndexEntryMetadata,
    validateExtractionPathMetadata
};
