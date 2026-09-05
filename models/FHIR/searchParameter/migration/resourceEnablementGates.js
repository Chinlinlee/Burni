const fs = require("fs");
const path = require("path");
const productionResources = require("../../fhir.resourceList.json");
const { getEnablementGates } = require("./compatibilityPolicy");
const { buildLookupMatrix } = require("./lookupMatrix");
const { loadHitSetArtifact } = require("./hitSets");
const { executeSearchQueryPlan } = require("../executor/mongoExecutor");

const RESOURCE_ENABLEMENT_ARTIFACT = path.join(__dirname, "artifacts/resource-enablement.json");

/**
 * @typedef {Object} GateResult
 * @property {boolean} passed
 * @property {string[]} errors
 */

/**
 * @typedef {Object} ResourceGateEvaluation
 * @property {string} resourceType
 * @property {boolean} passed
 * @property {Record<string, GateResult>} gates
 * @property {boolean} fallbackDisabled
 * @property {string[]} errors
 */

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {Object} hitSet
 * @returns {GateResult}
 */
function verifyGoldenFilter(plan, hitSet) {
    const errors = [];
    if (!hitSet || hitSet.status !== "defined") {
        return { passed: false, errors: ["Hit-set is not defined"] };
    }

    const parameterName = Object.keys(hitSet.positive.query)[0];
    const rawValue = hitSet.positive.query[parameterName];

    try {
        const filter = executeSearchQueryPlan(plan, rawValue, parameterName);
        if (!filter || typeof filter !== "object" || Object.keys(filter).length === 0) {
            errors.push("Golden filter did not produce a Mongo filter");
        }
    } catch (error) {
        errors.push(`Golden filter execution failed: ${error.message}`);
    }

    return { passed: errors.length === 0, errors };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {{ single: string, or: string, and: string[] }}
 */
function sampleValuesForPlan(plan) {
    if (plan.searchType === "composite") {
        const componentSample = (component, alternate = false) => {
            switch (component.searchType) {
                case "number":
                    return alternate ? "eq20" : "eq10";
                case "date":
                case "dateTime":
                    return alternate ? "2001-01-01" : "2000-01-01";
                case "quantity":
                    return alternate ? "eq20|kg" : "eq10|kg";
                case "reference":
                    return alternate ? "Patient/example-2" : "Patient/example";
                case "uri":
                    return alternate
                        ? "http://example.org/test-2"
                        : "http://example.org/test";
                case "token":
                    return alternate ? "urn:burni:sample|code-2" : "urn:burni:sample|code";
                case "string":
                default:
                    return alternate ? "sample-2" : "sample";
            }
        };
        const firstPair = (plan.composite?.components || [])
            .map(componentSample)
            .join("$");
        const secondPair = (plan.composite?.components || [])
            .map((component) => componentSample(component, true))
            .join("$");
        return {
            single: firstPair,
            or: `${firstPair},${secondPair}`,
            and: [firstPair, secondPair]
        };
    }

    const referenceTarget =
        plan.extractionPaths.find((entry) => entry.referenceTargetType)?.referenceTargetType ||
        plan.targets?.[0] ||
        "Patient";

    switch (plan.searchType) {
        case "uri":
        case "url":
            return {
                single: "http://example.org/test",
                or: "http://example.org/a,http://example.org/b",
                and: ["http://example.org/a", "http://example.org/b"]
            };
        case "reference":
            return {
                single: `${referenceTarget}/example`,
                or: `${referenceTarget}/a,${referenceTarget}/b`,
                and: [`${referenceTarget}/a`, `${referenceTarget}/b`]
            };
        case "token":
            return {
                single: "http://example.org|code",
                or: "http://example.org|a,http://example.org|b",
                and: ["http://example.org|a", "http://example.org|b"]
            };
        case "date":
        case "dateTime":
            return {
                single: "2000-01-01",
                or: "2000-01-01,2001-01-01",
                and: ["2000-01-01", "2001-01-01"]
            };
        case "number":
        case "quantity":
            return {
                single: "eq10",
                or: "eq10,eq20",
                and: ["eq10", "eq20"]
            };
        default:
            return {
                single: "gate-a",
                or: "gate-a,gate-b",
                and: ["gate-a", "gate-b"]
            };
    }
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {GateResult}
 */
function verifyOperatorMultiplicity(plan) {
    const errors = [];
    const parameterName = plan.code;
    const samples = sampleValuesForPlan(plan);

    if (plan.searchType === "composite") {
        for (const [rawValue, label] of [
            [samples.single, "single"],
            [samples.or, "OR"],
            [samples.and, "AND"]
        ]) {
            try {
                executeSearchQueryPlan(
                    plan,
                    rawValue,
                    parameterName
                );
            } catch (error) {
                errors.push(`Composite ${label} verification failed: ${error.message}`);
            }
        }
        return { passed: errors.length === 0, errors };
    }

    let presentFilter;
    let absentFilter;
    try {
        presentFilter = executeSearchQueryPlan(plan, "false", `${parameterName}:missing`);
        absentFilter = executeSearchQueryPlan(plan, "true", `${parameterName}:missing`);
    } catch (error) {
        return {
            passed: false,
            errors: [`Missing-value filter execution failed: ${error.message}`]
        };
    }

    if (JSON.stringify(presentFilter) === JSON.stringify(absentFilter)) {
        errors.push("Missing true and false filters must differ");
    }

    if (plan.multipleOr !== false) {
        try {
            executeSearchQueryPlan(plan, samples.or, parameterName);
        } catch (error) {
            errors.push(`multipleOr verification failed: ${error.message}`);
        }
    }

    if (plan.multipleAnd !== false) {
        try {
            const andFilter = executeSearchQueryPlan(plan, samples.and, parameterName);
            if (!andFilter.$and && samples.and.length > 1) {
                errors.push("Repeated values did not produce an AND filter");
            }
        } catch (error) {
            errors.push(`multipleAnd verification failed: ${error.message}`);
        }
    }

    try {
        executeSearchQueryPlan(plan, samples.single, parameterName);
    } catch (error) {
        errors.push(`Single-value execution failed: ${error.message}`);
    }

    return { passed: errors.length === 0, errors };
}

/**
 * @param {string} resourceType
 * @param {Object} matrixResource
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @returns {GateResult}
 */
function verifyResourceDiagnostics(resourceType, matrixResource, snapshot) {
    const errors = [];

    if (!matrixResource) {
        return { passed: false, errors: [`Missing lookup matrix entry for ${resourceType}`] };
    }

    for (const [code, lookup] of Object.entries(matrixResource.lookups || {})) {
        const lookupKey = `${resourceType}::${code}`;
        if (!lookup.outcome) {
            errors.push(`Unclassified lookup outcome: ${lookupKey}`);
            continue;
        }
        if (lookup.outcome === "compiled") {
            const definition = snapshot.byLookupKey.get(lookupKey);
            const plan =
                definition?.lookupPlans?.[lookupKey]?.plan || definition?.compiledPlan || null;
            if (!plan) {
                errors.push(`Compiled lookup missing plan: ${lookupKey}`);
            }
        }
        if (snapshot.conflictLookupKeys.has(lookupKey)) {
            errors.push(`Active conflict lookup: ${lookupKey}`);
        }
    }

    return { passed: errors.length === 0, errors };
}

/**
 * @param {string} resourceType
 * @param {Object} matrixResource
 * @param {Object} fixtureArchive
 * @returns {GateResult}
 */
function verifyStructuralRegistry(resourceType, matrixResource, fixtureArchive) {
    const errors = [];
    const fixture = fixtureArchive?.resources?.[resourceType];

    if (!fixture) {
        return { passed: false, errors: [`Missing fixture archive entry for ${resourceType}`] };
    }
    if (!fixture.activeFixturePath || !fs.existsSync(path.resolve(fixture.activeFixturePath))) {
        errors.push(`Missing active fixture for ${resourceType}`);
    }

    const lookupCount = matrixResource?.lookupCount || 0;
    const outcome = matrixResource?.outcome;

    if (lookupCount === 0) {
        if (outcome !== "no-lookup") {
            errors.push(`${resourceType} should be classified as no-lookup`);
        }
        return { passed: errors.length === 0, errors };
    }

    if (!matrixResource?.lookups || Object.keys(matrixResource.lookups).length === 0) {
        errors.push(`${resourceType} has lookups but no lookup matrix entries`);
    }

    return { passed: errors.length === 0, errors };
}

/**
 * @param {string} resourceType
 * @param {Object} matrixResource
 * @param {Object} hitSetArtifact
 * @returns {GateResult}
 */
function verifyDocumentHitSetArtifact(resourceType, matrixResource, hitSetArtifact) {
    const errors = [];

    for (const [code, lookup] of Object.entries(matrixResource?.lookups || {})) {
        if (lookup.outcome !== "compiled") {
            continue;
        }
        const lookupKey = `${resourceType}::${code}`;
        const hitSet = hitSetArtifact.resources?.[resourceType]?.[code];
        if (!hitSet || hitSet.status !== "defined") {
            errors.push(`${lookupKey}: hit-set is not defined`);
            continue;
        }
        if (!hitSet.positive?.query || !hitSet.companionNegative) {
            errors.push(`${lookupKey}: hit-set is missing positive or companion metadata`);
        }
    }

    return { passed: errors.length === 0, errors };
}

/**
 * @param {Object} input
 * @param {string} input.resourceType
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} input.definitions
 * @param {Object} input.fixtureArchive
 * @param {Object} [input.hitSetArtifact]
 * @returns {ResourceGateEvaluation}
 */
function evaluateResourceGates({
    resourceType,
    snapshot,
    definitions,
    fixtureArchive,
    hitSetArtifact = loadHitSetArtifact()
}) {
    const matrix = buildLookupMatrix(snapshot, definitions);
    const matrixResource = matrix.resources[resourceType];
    /** @type {Record<string, GateResult>} */
    const gates = {
        diagnostics: verifyResourceDiagnostics(resourceType, matrixResource, snapshot),
        "structural-registry": verifyStructuralRegistry(
            resourceType,
            matrixResource,
            fixtureArchive
        )
    };

    const lookupCount = matrixResource?.lookupCount || 0;
    const compiledLookups = Object.entries(matrixResource?.lookups || {}).filter(
        ([, lookup]) => lookup.outcome === "compiled"
    );

    if (lookupCount > 0 && compiledLookups.length > 0) {
        /** @type {string[]} */
        const goldenErrors = [];
        /** @type {string[]} */
        const operatorErrors = [];

        for (const [code] of compiledLookups) {
            const lookupKey = `${resourceType}::${code}`;
            const definition = snapshot.byLookupKey.get(lookupKey);
            const plan =
                definition?.lookupPlans?.[lookupKey]?.plan || definition?.compiledPlan || null;
            const hitSet = hitSetArtifact.resources?.[resourceType]?.[code] || null;

            if (!plan) {
                goldenErrors.push(`${lookupKey}: missing compiled plan`);
                operatorErrors.push(`${lookupKey}: missing compiled plan`);
                continue;
            }

            const goldenResult = verifyGoldenFilter(plan, hitSet);
            if (!goldenResult.passed) {
                goldenErrors.push(...goldenResult.errors.map((error) => `${lookupKey}: ${error}`));
            }

            const operatorResult = verifyOperatorMultiplicity(plan);
            if (!operatorResult.passed) {
                operatorErrors.push(
                    ...operatorResult.errors.map((error) => `${lookupKey}: ${error}`)
                );
            }
        }

        gates["golden-filter"] = { passed: goldenErrors.length === 0, errors: goldenErrors };
        gates["document-hit-set"] = verifyDocumentHitSetArtifact(
            resourceType,
            matrixResource,
            hitSetArtifact
        );
        gates["operator-multiplicity"] = {
            passed: operatorErrors.length === 0,
            errors: operatorErrors
        };
    }

    const errors = [];
    for (const gateName of getEnablementGates()) {
        const gate = gates[gateName];
        if (!gate) {
            continue;
        }
        if (!gate.passed) {
            errors.push(...gate.errors.map((error) => `${gateName}: ${error}`));
        }
    }

    const passed = errors.length === 0;
    return {
        resourceType,
        passed,
        gates,
        fallbackDisabled: passed,
        errors
    };
}

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} input.definitions
 * @param {Object} input.fixtureArchive
 * @param {Object} [input.hitSetArtifact]
 * @returns {{ resources: Record<string, ResourceGateEvaluation>, summary: Object }}
 */
function evaluateAllResourceGates(input) {
    /** @type {Record<string, ResourceGateEvaluation>} */
    const resources = {};
    let passedResources = 0;
    let fallbackDisabledResources = 0;

    for (const resourceType of productionResources) {
        const evaluation = evaluateResourceGates({ ...input, resourceType });
        resources[resourceType] = evaluation;
        if (evaluation.passed) {
            passedResources += 1;
        }
        if (evaluation.fallbackDisabled) {
            fallbackDisabledResources += 1;
        }
    }

    return {
        resources,
        summary: {
            resourceCount: productionResources.length,
            passedResources,
            fallbackDisabledResources,
            failedResources: productionResources.length - passedResources,
            gates: getEnablementGates()
        }
    };
}

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} input.definitions
 * @param {Object} input.fixtureArchive
 * @param {Object} [input.hitSetArtifact]
 * @returns {Object}
 */
function buildResourceEnablementArtifact(input) {
    const evaluation = evaluateAllResourceGates(input);
    const body = {
        resources: Object.fromEntries(
            Object.entries(evaluation.resources).map(([resourceType, entry]) => [
                resourceType,
                {
                    passed: entry.passed,
                    fallbackDisabled: entry.fallbackDisabled,
                    gates: Object.fromEntries(
                        Object.entries(entry.gates).map(([gateName, gate]) => [
                            gateName,
                            { passed: gate.passed, errorCount: gate.errors.length }
                        ])
                    ),
                    errors: entry.errors
                }
            ])
        ),
        summary: evaluation.summary
    };

    return {
        version: 1,
        generatedAt: new Date().toISOString(),
        ...body
    };
}

/**
 * @returns {Object | null}
 */
function loadResourceEnablementArtifact() {
    if (!fs.existsSync(RESOURCE_ENABLEMENT_ARTIFACT)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(RESOURCE_ENABLEMENT_ARTIFACT, "utf8"));
}

/**
 * @param {Object} committed
 * @param {Object} current
 * @returns {{ valid: boolean, errors: string[] }}
 */
function verifyResourceEnablementArtifact(committed, current) {
    const errors = [];
    if (committed.summary?.resourceCount !== current.summary?.resourceCount) {
        errors.push("Resource enablement count drift detected");
    }
    if (committed.summary?.passedResources !== current.summary?.passedResources) {
        errors.push(
            `Passed resource count drift: committed ${committed.summary?.passedResources}, current ${current.summary?.passedResources}`
        );
    }
    for (const resourceType of productionResources) {
        const committedResource = committed.resources?.[resourceType];
        const currentResource = current.resources?.[resourceType];
        if (!committedResource || !currentResource) {
            errors.push(`Missing resource enablement entry: ${resourceType}`);
            continue;
        }
        if (committedResource.passed !== currentResource.passed) {
            errors.push(`Enablement status drift for ${resourceType}`);
        }
        if (committedResource.fallbackDisabled !== currentResource.fallbackDisabled) {
            errors.push(`Fallback disablement drift for ${resourceType}`);
        }
    }
    return { valid: errors.length === 0, errors };
}

module.exports = {
    RESOURCE_ENABLEMENT_ARTIFACT,
    verifyGoldenFilter,
    verifyOperatorMultiplicity,
    verifyResourceDiagnostics,
    verifyStructuralRegistry,
    verifyDocumentHitSetArtifact,
    evaluateResourceGates,
    evaluateAllResourceGates,
    buildResourceEnablementArtifact,
    loadResourceEnablementArtifact,
    verifyResourceEnablementArtifact
};
