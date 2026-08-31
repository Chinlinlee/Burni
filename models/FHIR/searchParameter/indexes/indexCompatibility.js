const mongoose = require("mongoose");
const { getIndexIdentity } = require("./indexManifest");
const {
    validateTemporalIndexManifest,
    validateTemporalIndexEntryCompatibility
} = require("./indexValidation");
const { createTypedFilterPlan } = require("../executor/queryValueParser");

const TEMPORAL_SEARCH_TYPES = new Set(["date", "dateTime"]);
const EXECUTION_MODES = new Set(["find", "aggregate", "chained"]);
const SKIPPED_FILTER_OPERATORS = new Set(["$exists", "$type"]);

function createDiagnostic(code, message, details = {}) {
    return { code, message, ...details };
}

function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isDecimal128(value) {
    return (
        value instanceof mongoose.Types.Decimal128 ||
        value?._bsontype === "Decimal128" ||
        value?.constructor?.name === "Decimal128"
    );
}

function collectFilterEvidence(filter) {
    const fields = new Map();
    const fieldOperators = new Map();
    const elemMatchPaths = new Set();

    function addField(path, value, operator) {
        if (!fields.has(path)) {
            fields.set(path, []);
        }
        if (!fieldOperators.has(path)) {
            fieldOperators.set(path, new Set());
        }
        if (operator) {
            fieldOperators.get(path).add(operator);
        }
        if (value !== undefined) {
            fields.get(path).push(value);
        }
    }

    function visitOperatorValue(value, path, operator) {
        if (Array.isArray(value)) {
            value.forEach((entry) => visitOperatorValue(entry, path, operator));
            return;
        }
        if (!isPlainObject(value)) {
            addField(path, value, operator);
            return;
        }
        for (const [operator, operatorValue] of Object.entries(value)) {
            if (operator === "$elemMatch") {
                elemMatchPaths.add(path);
                visit(operatorValue, path);
                continue;
            }
            if (operator.startsWith("$")) {
                if (!SKIPPED_FILTER_OPERATORS.has(operator)) {
                    visitOperatorValue(operatorValue, path, operator);
                }
                continue;
            }
            visit(operatorValue, path ? `${path}.${operator}` : operator);
        }
    }

    function visit(node, prefix = "") {
        if (Array.isArray(node)) {
            node.forEach((entry) => visit(entry, prefix));
            return;
        }
        if (!isPlainObject(node)) {
            return;
        }
        for (const [key, value] of Object.entries(node)) {
            if (key.startsWith("$")) {
                if (key === "$elemMatch") {
                    elemMatchPaths.add(prefix);
                    visit(value, prefix);
                } else {
                    visit(value, prefix);
                }
                continue;
            }

            const fieldPath = prefix ? `${prefix}.${key}` : key;
            if (isPlainObject(value)) {
                if (Object.prototype.hasOwnProperty.call(value, "$elemMatch")) {
                    elemMatchPaths.add(fieldPath);
                    visit(value.$elemMatch, fieldPath);
                    for (const [operator, operatorValue] of Object.entries(value)) {
                        if (operator !== "$elemMatch" && operator.startsWith("$")) {
                            if (!SKIPPED_FILTER_OPERATORS.has(operator)) {
                                visitOperatorValue(operatorValue, fieldPath);
                            }
                        }
                    }
                } else if (Object.keys(value).some((entry) => entry.startsWith("$"))) {
                    for (const [operator, operatorValue] of Object.entries(value)) {
                        if (operator.startsWith("$")) {
                            if (operator === "$elemMatch") {
                                elemMatchPaths.add(fieldPath);
                                visit(operatorValue, fieldPath);
                            } else if (!SKIPPED_FILTER_OPERATORS.has(operator)) {
                                visitOperatorValue(operatorValue, fieldPath, operator);
                            }
                        } else {
                            visit(operatorValue, `${fieldPath}.${operator}`);
                        }
                    }
                    addField(fieldPath);
                } else {
                    visit(value, fieldPath);
                }
            } else {
                addField(fieldPath, value);
            }
        }
    }

    visit(filter);
    return { fields, fieldOperators, elemMatchPaths };
}

function validateTemporalFilterAgainstIndex(entry, filter) {
    const diagnostics = [];
    const evidence = collectFilterEvidence(filter);
    const indexedFields = entry.fields || [];
    const matchedFields = indexedFields.filter((field) => evidence.fields.has(field));

    if (matchedFields.length === 0) {
        diagnostics.push(
            createDiagnostic(
                "temporal-filter-shape-mismatch",
                `Temporal filter does not reference ${entry.extractionPath} normalized fields`,
                { extractionPath: entry.extractionPath, indexedFields }
            )
        );
    }

    for (const field of matchedFields) {
        const values = evidence.fields.get(field) || [];
        if (entry.bsonType === "decimal") {
            const invalidValues = values.filter((value) => !isDecimal128(value));
            if (invalidValues.length > 0) {
                diagnostics.push(
                    createDiagnostic(
                        "temporal-filter-bson-type-mismatch",
                        `Temporal filter uses a non-Decimal128 value for ${field}`,
                        { field, expectedBsonType: "decimal" }
                    )
                );
            }
        }
        if (entry.bsonType === "string") {
            const invalidValues = values.filter(
                (value) => typeof value !== "string" && value !== undefined
            );
            if (invalidValues.length > 0) {
                diagnostics.push(
                    createDiagnostic(
                        "temporal-filter-bson-type-mismatch",
                        `Temporal filter uses a non-string value for ${field}`,
                        { field, expectedBsonType: "string" }
                    )
                );
            }
        }
    }

    const arrayPaths = entry.compatibility?.arrayPaths || [];
    for (const arrayPath of arrayPaths) {
        if (!evidence.elemMatchPaths.has(arrayPath)) {
            diagnostics.push(
                createDiagnostic(
                    "missing-element-correlation",
                    `Temporal array filter must use $elemMatch at ${arrayPath}`,
                    { extractionPath: entry.extractionPath, arrayPath }
                )
            );
        }
    }

    const disallowedRawValueOperators = new Set([
        "literal",
        "$eq",
        "$ne",
        "$gt",
        "$gte",
        "$lt",
        "$lte",
        "$in",
        "$nin"
    ]);
    const rawValueFields = [...evidence.fields.keys()].filter((field) => {
        if (!field.endsWith(".value")) {
            return false;
        }
        return [...(evidence.fieldOperators.get(field) || [])].some((operator) =>
            disallowedRawValueOperators.has(operator)
        );
    });
    if (rawValueFields.length > 0) {
        diagnostics.push(
            createDiagnostic(
                "raw-temporal-value-filter",
                "Temporal range validation rejects raw FHIR value predicates",
                { extractionPath: entry.extractionPath, fields: rawValueFields }
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        evidence,
        matchedFields
    };
}

function getTemporalEntriesForPlan(manifest, plan) {
    const entries = [];
    const indexes = Array.isArray(manifest?.indexes) ? manifest.indexes : [];
    for (const extractionPath of plan?.extractionPaths || []) {
        const entry = indexes.find(
            (candidate) =>
                candidate?.extractionPath === extractionPath.path &&
                candidate?.datatype === extractionPath.datatype
        );
        entries.push({ extractionPath, entry });
    }
    return entries;
}

function validateTemporalPlanIndexCompatibility({ manifest, plan, filter, executionMode = "find" }) {
    const diagnostics = [];
    const manifestResult = validateTemporalIndexManifest(manifest);
    if (!manifestResult.valid) {
        diagnostics.push(
            ...manifestResult.errors.map((message) =>
                createDiagnostic("index-manifest-invalid", message)
            )
        );
    }

    if (!plan || !TEMPORAL_SEARCH_TYPES.has(plan.searchType)) {
        return {
            valid: diagnostics.length === 0,
            skipped: true,
            diagnostics
        };
    }

    if (!EXECUTION_MODES.has(executionMode)) {
        diagnostics.push(
            createDiagnostic(
                "unsupported-execution-mode",
                `Unsupported temporal explain execution mode: ${executionMode}`,
                { executionMode }
            )
        );
    }

    const planEntries = getTemporalEntriesForPlan(manifest, plan);
    for (const { extractionPath, entry } of planEntries) {
        if (!entry) {
            diagnostics.push(
                createDiagnostic(
                    "missing-temporal-index",
                    `No temporal index exists for ${extractionPath.path}`,
                    {
                        extractionPath: extractionPath.path,
                        datatype: extractionPath.datatype
                    }
                )
            );
            continue;
        }
        diagnostics.push(...validateTemporalIndexEntryCompatibility(entry).diagnostics);
    }

    if (filter) {
        for (const { entry } of planEntries) {
            if (entry) {
                diagnostics.push(...validateTemporalFilterAgainstIndex(entry, filter).diagnostics);
            }
        }
    }

    const entries = planEntries.map((item) => item.entry).filter(Boolean);
    if (planEntries.length > 1 && entries.length !== planEntries.length) {
        diagnostics.push(
            createDiagnostic(
                "incomplete-choice-index-set",
                "Every temporal choice branch must have its own compatible index",
                { resourceType: plan.resourceType, planCode: plan.code }
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        skipped: false,
        diagnostics,
        entries,
        indexNames: entries.map((entry) => entry.name).sort(),
        filterEvidence: filter ? collectFilterEvidence(filter) : undefined
    };
}

function createDryRunExplainAdapter(options = {}) {
    const indexSelector =
        options.indexSelector ||
        (({ indexEntries }) => indexEntries[0]?.name);

    return async function dryRunExplainAdapter(request) {
        const selectedIndex = indexSelector(request);
        return {
            dryRun: true,
            unsupportedConditions: [],
            queryPlanner: {
                winningPlan: selectedIndex
                    ? {
                          stage: "IXSCAN",
                          indexName: selectedIndex
                      }
                    : { stage: "COLLSCAN" },
                executionMode: request.executionMode,
                filter: request.filter
            }
        };
    };
}

function createMongoExplainAdapter(collection, options = {}) {
    if (!collection || typeof collection.find !== "function") {
        throw new Error("Mongo explain adapter requires a collection");
    }
    const verbosity = options.verbosity || "executionStats";

    return function mongoExplainAdapter(request) {
        if (request.executionMode === "find") {
            return collection.find(request.filter).explain(verbosity);
        }
        const pipeline = request.pipeline || [{ $match: request.filter }];
        if (typeof collection.aggregate !== "function") {
            throw new Error("Mongo explain adapter collection does not support aggregate");
        }
        return collection.aggregate(pipeline).explain(verbosity);
    };
}

function collectWinningIndexNames(plan, names = new Set()) {
    if (Array.isArray(plan)) {
        plan.forEach((entry) => collectWinningIndexNames(entry, names));
        return names;
    }
    if (!plan || typeof plan !== "object") {
        return names;
    }
    if (plan.stage === "IXSCAN" && typeof plan.indexName === "string") {
        names.add(plan.indexName);
    }
    for (const value of Object.values(plan)) {
        if (value && typeof value === "object") {
            collectWinningIndexNames(value, names);
        }
    }
    return names;
}

function getWinningPlan(explain) {
    return (
        explain?.queryPlanner?.winningPlan ||
        explain?.stages?.find((stage) => stage.$cursor)?.$cursor?.queryPlanner
            ?.winningPlan ||
        null
    );
}

function getExplainPayload(result) {
    if (result?.explain) {
        return result.explain;
    }
    return result;
}

async function verifyTemporalQueryExplain({
    manifest,
    plan,
    rawValue,
    parameterName,
    filter,
    executionMode = "find",
    pipeline,
    explainAdapter,
    adapter,
    dryRun = false,
    verbosity
}) {
    let queryFilter = filter;
    try {
        if (!queryFilter) {
            queryFilter = createTypedFilterPlan(plan, rawValue, parameterName).filter;
        }
    } catch (error) {
        return {
            valid: false,
            diagnostics: [
                createDiagnostic(
                    "temporal-filter-build-failed",
                    error instanceof Error ? error.message : String(error)
                )
            ]
        };
    }

    const compatibility = validateTemporalPlanIndexCompatibility({
        manifest,
        plan,
        filter: queryFilter,
        executionMode
    });
    if (!compatibility.valid) {
        return compatibility;
    }

    const resolvedAdapter =
        explainAdapter || adapter || (dryRun ? createDryRunExplainAdapter() : null);
    if (!resolvedAdapter) {
        return {
            ...compatibility,
            valid: false,
            diagnostics: [
                ...compatibility.diagnostics,
                createDiagnostic(
                    "explain-adapter-required",
                    "Mongo explain verification requires an explain adapter or dryRun=true"
                )
            ]
        };
    }

    try {
        const adapterResult =
            typeof resolvedAdapter === "function"
                ? await resolvedAdapter({
                      executionMode,
                      filter: queryFilter,
                      pipeline,
                      plan,
                      indexEntries: compatibility.entries,
                      indexNames: compatibility.indexNames,
                      parameterName,
                      rawValue,
                      verbosity
                  })
                : await resolvedAdapter.explain({
                      executionMode,
                      filter: queryFilter,
                      pipeline,
                      plan,
                      indexEntries: compatibility.entries,
                      indexNames: compatibility.indexNames,
                      parameterName,
                      rawValue,
                      verbosity
                  });
        const explain = getExplainPayload(adapterResult);
        const unsupportedConditions = [
            ...(adapterResult?.unsupportedConditions || []),
            ...(explain?.unsupportedConditions || [])
        ];
        const diagnostics = unsupportedConditions.map((condition) =>
            createDiagnostic("explain-unsupported-condition", String(condition), {
                executionMode
            })
        );
        const winningPlan = getWinningPlan(explain);
        const usedIndexNames = [...collectWinningIndexNames(winningPlan)].sort();
        if (usedIndexNames.length === 0) {
            diagnostics.push(
                createDiagnostic(
                    "explain-no-winning-index",
                    "Explain winning plan does not contain an IXSCAN",
                    { executionMode }
                )
            );
        }
        if (
            usedIndexNames.length > 0 &&
            !usedIndexNames.some((indexName) => compatibility.indexNames.includes(indexName))
        ) {
            diagnostics.push(
                createDiagnostic(
                    "explain-index-mismatch",
                    "Explain winning plan uses an index outside the temporal manifest",
                    {
                        executionMode,
                        expectedIndexNames: compatibility.indexNames,
                        usedIndexNames
                    }
                )
            );
        }

        return {
            ...compatibility,
            valid: diagnostics.length === 0,
            diagnostics: [...compatibility.diagnostics, ...diagnostics],
            explain,
            winningPlan,
            usedIndexNames,
            executionMode,
            filter: queryFilter,
            pipeline
        };
    } catch (error) {
        return {
            ...compatibility,
            valid: false,
            diagnostics: [
                ...compatibility.diagnostics,
                createDiagnostic(
                    "explain-adapter-error",
                    error instanceof Error ? error.message : String(error),
                    { executionMode }
                )
            ]
        };
    }
}

function serializeFilterValue(value) {
    if (isDecimal128(value)) {
        return { $decimal128: value.toString() };
    }
    if (value instanceof RegExp) {
        return { $regex: value.toString() };
    }
    if (Array.isArray(value)) {
        return value.map(serializeFilterValue);
    }
    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, nested]) => [key, serializeFilterValue(nested)])
        );
    }
    return value;
}

async function verifyTemporalExecutionModes(options) {
    let filterPlan;
    try {
        filterPlan =
            options.filterPlan ||
            createTypedFilterPlan(options.plan, options.rawValue, options.parameterName);
    } catch (error) {
        return {
            valid: false,
            diagnostics: [
                createDiagnostic(
                    "temporal-filter-build-failed",
                    error instanceof Error ? error.message : String(error)
                )
            ],
            results: {}
        };
    }
    const modes = options.modes || ["find", "aggregate", "chained"];
    const results = {};
    for (const executionMode of modes) {
        results[executionMode] = await verifyTemporalQueryExplain({
            ...options,
            filter: filterPlan.filter,
            executionMode,
            pipeline: options.pipelines?.[executionMode]
        });
    }

    const signatures = modes.map((mode) =>
        JSON.stringify(serializeFilterValue(results[mode].filter))
    );
    const indexSignatures = modes.map((mode) =>
        JSON.stringify(results[mode].indexNames || [])
    );
    const diagnostics = modes.flatMap((mode) => results[mode].diagnostics || []);
    if (new Set(signatures).size > 1) {
        diagnostics.push(
            createDiagnostic(
                "execution-filter-mismatch",
                "Temporal execution modes do not share the same filter shape"
            )
        );
    }
    if (new Set(indexSignatures).size > 1) {
        diagnostics.push(
            createDiagnostic(
                "execution-index-metadata-mismatch",
                "Temporal execution modes do not share the same index metadata"
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        filterPlan,
        results,
        indexNames: results[modes[0]]?.indexNames || [],
        filter: filterPlan.filter
    };
}

function validateTemporalIndexCompatibility(manifest, options = {}) {
    if (manifest?.manifest && !manifest.kind) {
        options = manifest;
        manifest = options.manifest;
    }
    const diagnostics = [];
    const manifestResult = validateTemporalIndexManifest(manifest, {
        plans: options.plans,
        requirePlans: options.requirePlans === true
    });
    if (!manifestResult.valid) {
        diagnostics.push(
            ...manifestResult.errors.map((message) =>
                createDiagnostic("index-manifest-invalid", message)
            )
        );
    }
    for (const entry of manifest?.indexes || []) {
        diagnostics.push(...validateTemporalIndexEntryCompatibility(entry).diagnostics);
    }
    for (const plan of options.plans || []) {
        const result = validateTemporalPlanIndexCompatibility({
            manifest,
            plan
        });
        diagnostics.push(...result.diagnostics);
    }
    const entries = (manifest?.indexes || []).filter(
        (entry) => entry && typeof entry.name === "string"
    );
    return {
        valid: diagnostics.length === 0,
        diagnostics,
        indexNames: entries.map((entry) => entry.name).sort(),
        identity: entries.map(getIndexIdentity)
    };
}

module.exports = {
    EXECUTION_MODES,
    collectFilterEvidence,
    collectWinningIndexNames,
    createDryRunExplainAdapter,
    createMongoExplainAdapter,
    isDecimal128,
    validateTemporalFilterAgainstIndex,
    validateTemporalIndexCompatibility,
    validateIndexCompatibility: validateTemporalIndexCompatibility,
    validateTemporalIndexEntryCompatibility,
    validateTemporalPlanIndexCompatibility,
    verifyTemporalExecutionModes,
    verifyTemporalQueryExplain,
    verifyIndexExplain: verifyTemporalQueryExplain
};
