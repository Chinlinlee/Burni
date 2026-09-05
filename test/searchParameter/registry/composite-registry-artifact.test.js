require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const {
    readArtifact,
    hydrateDefinitionEntry
} = require("@models/FHIR/searchParameter/registry/artifacts/compiledArtifact");
const {
    buildRegistrySnapshot,
    resolveLookupStatus,
    getEffectiveDefinition
} = require("@models/FHIR/searchParameter/registry/snapshot");
const {
    OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL,
    observationComponentCodeValueQuantityDefinition,
    minimalCompositePlan,
    compileSetForComposite,
    toDefinition
} = require("../support/composite-fixtures");
const { isCompositeCompilerAvailable } = require("../support/composite-api-seam");

const OBSERVATION_COMPOSITE_LOOKUP = "Observation::component-code-value-quantity";
const OBSERVATION_COMPOSITE_CODE = "component-code-value-quantity";

describe("composite registry and artifact paths", function () {
    /**
     * @param {import('@models/FHIR/searchParameter/registry/artifacts/compiledArtifact').CompiledArtifactDefinitionEntry} entry
     */
    function snapshotFromArtifactEntry(entry) {
        const hydrated = hydrateDefinitionEntry(entry);
        const activated = applyActivationOverlay(hydrated, {
            compilable: entry.compile.compilable,
            reason: entry.compile.reason
        });
        activated.lookupPlans = entry.compile.lookupPlans;
        return buildRegistrySnapshot({
            definitions: [activated],
            diagnostics: entry.compile.diagnostics,
            version: 1
        });
    }

    it("hydrates active composite builtin artifact entries without recompiling", function () {
        const artifact = readArtifact();
        const entry = artifact.definitions[`${OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL}::4.0.1`];
        expect(entry).to.exist;
        expect(entry.compile.compilable).to.equal(true);
        expect(entry.compile.lookupPlans[OBSERVATION_COMPOSITE_LOOKUP].compilable).to.equal(true);
        expect(
            entry.compile.diagnostics.some((diagnostic) => diagnostic.code === "unsupported-type")
        ).to.equal(false);

        const snapshot = snapshotFromArtifactEntry(entry);

        expect(resolveLookupStatus(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)).to.equal(
            "effective"
        );
        expect(getEffectiveDefinition(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)).to.exist;
    });

    it("keeps committed artifact composite diagnostics stable in the builtin artifact", function () {
        const artifact = readArtifact();
        const entry = artifact.definitions[`${OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL}::4.0.1`];

        expect(entry.compile.compilable).to.equal(true);
        expect(
            entry.compile.diagnostics.some((item) => item.code === "unsupported-type")
        ).to.equal(false);
        expect(entry.compile.lookupPlans[OBSERVATION_COMPOSITE_LOOKUP].plan.searchType).to.equal(
            "composite"
        );
    });

    it("keeps executable composite lookups on the effective registry path", function () {
        const artifact = readArtifact();
        const entry = artifact.definitions[`${OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL}::4.0.1`];
        const snapshot = snapshotFromArtifactEntry(entry);

        expect(resolveLookupStatus(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)).to.equal(
            "effective"
        );
        expect(getEffectiveDefinition(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)).to.exist;
    });

    it("does not activate database draft composite overlays", function () {
        const databaseComposite = toDefinition(
            {
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/db-composite",
                version: "4.0.1",
                status: "draft",
                code: "db-composite",
                base: ["Patient"],
                type: "composite",
                expression: "Patient.extension",
                component: [
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Patient-name",
                        expression: "valueString"
                    },
                    {
                        definition: "http://hl7.org/fhir/SearchParameter/Patient-gender",
                        expression: "valueCode"
                    }
                ]
            },
            "database"
        );
        const compiled = compileDefinition(databaseComposite);
        const activated = applyActivationOverlay(databaseComposite, {
            compilable: compiled.compilable,
            reason: compiled.reason
        });
        activated.lookupPlans = compiled.lookupPlans;

        const snapshot = buildRegistrySnapshot({
            definitions: [activated],
            diagnostics: compiled.diagnostics,
            version: 1
        });

        expect(resolveLookupStatus(snapshot, "Patient", "db-composite")).to.equal("disabled");
        expect(getEffectiveDefinition(snapshot, "Patient", "db-composite")).to.equal(null);
    });

    it("hydrates an active composite lookup when artifact compile output is executable", function () {
        const definition = observationComponentCodeValueQuantityDefinition();
        const plan = minimalCompositePlan();
        const entry = {
            resource: definition.resource,
            source: "builtin-bundle",
            canonicalKey: definition.canonicalKey,
            lookupKeys: definition.lookupKeys,
            rawStatus: definition.rawStatus,
            compile: {
                compilable: true,
                lookupPlans: {
                    [OBSERVATION_COMPOSITE_LOOKUP]: {
                        compilable: true,
                        plan
                    }
                },
                diagnostics: []
            }
        };

        const hydrated = hydrateDefinitionEntry(entry);
        const activated = applyActivationOverlay(hydrated, { compilable: true });
        activated.lookupPlans = entry.compile.lookupPlans;

        const snapshot = buildRegistrySnapshot({
            definitions: [activated],
            diagnostics: [],
            version: 1
        });

        expect(resolveLookupStatus(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)).to.equal(
            "effective"
        );
        const effective = getEffectiveDefinition(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE);
        expect(effective?.compiledPlan?.searchType).to.equal("composite");
        expect(effective?.compiledPlan?.composite?.branches).to.have.length.greaterThan(0);
    });

    (isCompositeCompilerAvailable() ? it : it.skip)(
        "promotes builtin composite lookups after compiler and artifact regeneration",
        function () {
            const definition = observationComponentCodeValueQuantityDefinition();
            const { createComponentResolver, compileCompositeDefinition } = require(
                "@models/FHIR/searchParameter/compiler/compositeCompiler"
            );
            const resolver = createComponentResolver(compileSetForComposite(definition));
            const compiled = compileCompositeDefinition(definition, resolver);
            if (!compiled.compilable) {
                this.skip();
            }

            const activated = applyActivationOverlay(definition, {
                compilable: compiled.compilable,
                reason: compiled.reason
            });
            activated.lookupPlans = compiled.lookupPlans;

            const snapshot = buildRegistrySnapshot({
                definitions: [activated],
                diagnostics: compiled.diagnostics,
                version: 1
            });

            expect(resolveLookupStatus(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)).to.equal(
                "effective"
            );
            expect(
                getEffectiveDefinition(snapshot, "Observation", OBSERVATION_COMPOSITE_CODE)
                    ?.compiledPlan?.searchType
            ).to.equal("composite");
        }
    );
});
