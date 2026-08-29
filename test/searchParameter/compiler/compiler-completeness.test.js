require("module-alias/register");

const { expect } = require("chai");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    loadResourceTypeMap,
    resolvePathDatatype
} = require("@models/FHIR/searchParameter/compiler/resourceTypeMap");
const { normalizePathForTypeResolution } = require("@models/FHIR/searchParameter/compiler/extractionPathCompiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const {
    buildRegistrySnapshot,
    getEffectiveDefinition,
    resolveLookupStatus
} = require("@models/FHIR/searchParameter/registry/snapshot");
const productionResources = require("@models/FHIR/fhir.resourceList.json");

const EXPECTED_FIXABLE_DISABLED = [
    "CarePlan::activity-date",
    "ConceptMap::product",
    "MedicationRequest::date",
    "PlanDefinition::definition",
    "Provenance::signature-type",
    "RiskAssessment::probability",
    "Specimen::collected",
    "StructureDefinition::base-path",
    "StructureDefinition::path",
    "StructureDefinition::valueset"
];

function compileAllLookups() {
    const summary = {
        compiled: 0,
        disabled: 0,
        unsupported: 0,
        disabledKeys: []
    };

    for (const definition of loadBuiltinDefinitions().definitions) {
        const result = compileDefinition(definition);
        for (const lookupKey of definition.lookupKeys) {
            const [resourceType] = lookupKey.split("::");
            if (!productionResources.includes(resourceType)) {
                continue;
            }

            const lookup = result.lookupPlans[lookupKey];
            const reason = lookup?.reason || result.reason || "";
            if (lookup?.compilable) {
                summary.compiled += 1;
            } else if (
                reason.includes("Unsupported search type") ||
                reason.includes("Unsupported expression feature") ||
                reason.includes("Missing expression")
            ) {
                summary.unsupported += 1;
            } else {
                summary.disabled += 1;
                summary.disabledKeys.push(lookupKey);
            }
        }
    }

    return summary;
}

describe("SearchParameter compiler completeness", function () {
    it("compiles the majority of production lookups", function () {
        const summary = compileAllLookups();
        expect(summary.compiled).to.be.greaterThan(1600);
        expect(summary.unsupported).to.equal(73);
        expect(summary.disabled).to.equal(EXPECTED_FIXABLE_DISABLED.length);
    });

    it("only leaves known deep-path lookups disabled", function () {
        const summary = compileAllLookups();
        expect(summary.disabledKeys.sort()).to.deep.equal(EXPECTED_FIXABLE_DISABLED.sort());
    });

    it("compiles context, relatedArtifact, bundle index, and choice-heavy lookups", function () {
        const summary = compileAllLookups();
        const compiled = new Set(
            loadBuiltinDefinitions()
                .definitions.flatMap((definition) => {
                    const result = compileDefinition(definition);
                    return definition.lookupKeys.filter((key) => result.lookupPlans[key]?.compilable);
                })
        );

        expect(compiled.has("ActivityDefinition::context")).to.equal(true);
        expect(compiled.has("ActivityDefinition::composed-of")).to.equal(true);
        expect(compiled.has("Bundle::composition")).to.equal(true);
        expect(compiled.has("Condition::onset-age")).to.equal(true);
        expect(compiled.has("InsurancePlan::name")).to.equal(true);
        expect(summary.disabled).to.equal(EXPECTED_FIXABLE_DISABLED.length);
    });

    it("gives every compiled lookup an independent typed plan", function () {
        const pollution = [];

        for (const definition of loadBuiltinDefinitions().definitions) {
            const result = compileDefinition(definition);
            /** @type {Object[]} */
            const compiledPlans = [];

            for (const lookupKey of definition.lookupKeys) {
                const [resourceType, code] = lookupKey.split("::");
                if (!productionResources.includes(resourceType)) {
                    continue;
                }

                const lookup = result.lookupPlans[lookupKey];
                if (!lookup?.compilable || !lookup.plan) {
                    continue;
                }

                const plan = lookup.plan;
                if (plan.resourceType !== resourceType || plan.code !== code) {
                    pollution.push(
                        `${lookupKey} plan identity is ${plan.resourceType}::${plan.code}`
                    );
                    continue;
                }

                if (compiledPlans.includes(plan)) {
                    pollution.push(`${lookupKey} shares a plan object with another lookup`);
                }
                compiledPlans.push(plan);

                const typeMap = loadResourceTypeMap(resourceType);
                const seenPaths = new Set();
                for (const entry of plan.extractionPaths) {
                    if (!entry.path || !entry.datatype) {
                        pollution.push(`${lookupKey} has an untyped extraction path`);
                        continue;
                    }
                    if (seenPaths.has(entry.path)) {
                        pollution.push(`${lookupKey} repeats extraction path ${entry.path}`);
                    }
                    seenPaths.add(entry.path);

                    const resolved = resolvePathDatatype(
                        typeMap,
                        normalizePathForTypeResolution(entry.path)
                    );
                    if (!resolved.found || resolved.datatype !== entry.datatype) {
                        pollution.push(
                            `${lookupKey} path ${entry.path} typed as ${entry.datatype}, type map has ${resolved.datatype}`
                        );
                    }
                }
            }
        }

        expect(pollution).to.deep.equal([]);
    });

    it("does not expose another base's plan through the snapshot", function () {
        const builtin = loadBuiltinDefinitions();
        const compiledDefinitions = builtin.definitions.map((definition) => {
            const compileResult = compileDefinition(definition);
            const activated = applyActivationOverlay(definition, {
                compilable: compileResult.compilable,
                reason: compileResult.reason
            });
            activated.lookupPlans = compileResult.lookupPlans;
            return activated;
        });
        const merged = mergeDefinitions(compiledDefinitions);
        const snapshot = buildRegistrySnapshot({
            definitions: merged.definitions,
            diagnostics: merged.diagnostics,
            version: 1
        });

        const leaked = [];
        for (const definition of merged.definitions) {
            for (const lookupKey of definition.lookupKeys) {
                const [resourceType, code] = lookupKey.split("::");
                if (!productionResources.includes(resourceType)) {
                    continue;
                }

                const lookupPlan = definition.lookupPlans?.[lookupKey];
                if (lookupPlan && !lookupPlan.compilable) {
                    if (resolveLookupStatus(snapshot, resourceType, code) === "effective") {
                        leaked.push(`${lookupKey} is effective despite a disabled lookup plan`);
                    }
                    continue;
                }

                const effective = getEffectiveDefinition(snapshot, resourceType, code);
                if (!effective?.compiledPlan) {
                    continue;
                }
                if (effective.compiledPlan.resourceType !== resourceType) {
                    leaked.push(
                        `${lookupKey} snapshot plan is for ${effective.compiledPlan.resourceType}`
                    );
                }
            }
        }

        expect(leaked).to.deep.equal([]);
    });

    it("omits incompatible-branch paths from every compiled plan", function () {
        const leaked = [];

        for (const definition of loadBuiltinDefinitions().definitions) {
            const result = compileDefinition(definition);
            for (const lookupKey of definition.lookupKeys) {
                const [resourceType] = lookupKey.split("::");
                if (!productionResources.includes(resourceType)) {
                    continue;
                }
                const lookup = result.lookupPlans[lookupKey];
                if (!lookup?.compilable || !lookup.plan) {
                    continue;
                }

                const planPaths = new Set(lookup.plan.extractionPaths.map((entry) => entry.path));
                const omitted = result.diagnostics.filter(
                    (entry) =>
                        entry.lookupKey === lookupKey && entry.code === "incompatible-branch"
                );
                for (const diagnostic of omitted) {
                    const omittedPath =
                        /^Path (\S+) is missing/.exec(diagnostic.message)?.[1] ||
                        / at (\S+)$/.exec(diagnostic.message)?.[1];
                    if (omittedPath && planPaths.has(omittedPath)) {
                        leaked.push(`${lookupKey} kept incompatible path ${omittedPath}`);
                    }
                }

                const untyped = lookup.plan.extractionPaths.filter(
                    (entry) => !entry.path || !entry.datatype
                );
                if (untyped.length > 0) {
                    leaked.push(`${lookupKey} has untyped extraction paths`);
                }
            }
        }

        expect(leaked).to.deep.equal([]);
    });

    it("puts reference target and extraction metadata on compiled reference plans", function () {
        const missing = [];

        for (const definition of loadBuiltinDefinitions().definitions) {
            const result = compileDefinition(definition);
            if (definition.resource.type !== "reference") {
                continue;
            }

            for (const lookupKey of definition.lookupKeys) {
                const [resourceType] = lookupKey.split("::");
                if (!productionResources.includes(resourceType)) {
                    continue;
                }
                const lookup = result.lookupPlans[lookupKey];
                if (!lookup?.compilable || !lookup.plan) {
                    continue;
                }

                const plan = lookup.plan;
                const declaredTarget = definition.resource.target || [];
                if (declaredTarget.length > 0) {
                    if (!Array.isArray(plan.target) || plan.target.join(",") !== declaredTarget.join(",")) {
                        missing.push(`${lookupKey} is missing declared reference target metadata`);
                    }
                    if (!Array.isArray(plan.targets) || !declaredTarget.every((target) => plan.targets.includes(target))) {
                        missing.push(`${lookupKey} is missing merged targets metadata`);
                    }
                }

                if (!Array.isArray(plan.supportedValueForms) || plan.supportedValueForms.join(",") !== "type/id,id,absolute-url") {
                    missing.push(`${lookupKey} is missing supported reference value forms`);
                }

                if (plan.extractionPaths.length === 0) {
                    missing.push(`${lookupKey} has no extraction paths`);
                }
                for (const entry of plan.extractionPaths) {
                    if (!entry.path || !entry.datatype) {
                        missing.push(`${lookupKey} has an untyped reference extraction path`);
                    }
                    if (entry.referenceTargetType && entry.datatype === "Reference") {
                        if (entry.correlation?.kind !== "same-array-element") {
                            missing.push(`${lookupKey} is missing same-array-element correlation for ${entry.path}`);
                        }
                    }
                }
            }
        }

        expect(missing).to.deep.equal([]);
    });
});
