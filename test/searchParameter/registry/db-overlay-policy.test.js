require("module-alias/register");

const { expect } = require("chai");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    buildRegistrySnapshot,
    resolveLookupStatus,
    getEffectiveDefinition
} = require("@models/FHIR/searchParameter/registry/snapshot");

/**
 * @param {Object} resource
 * @param {'builtin-bundle' | 'database'} source
 * @param {string[]} lookupKeys
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition}
 */
function definition(resource, source, lookupKeys) {
    const url = resource.url || `http://example.org/SearchParameter/${lookupKeys[0]}`;
    return {
        resource: {
            resourceType: "SearchParameter",
            version: "4.0.1",
            ...resource,
            url
        },
        source,
        canonicalKey: `${url}::4.0.1`,
        lookupKeys,
        rawStatus: resource.status || "unknown",
        effectiveStatus: "disabled",
        diagnostics: []
    };
}

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} definitions
 */
function buildSnapshot(definitions) {
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    const compiledDefinitions = [];
    /** @type {import('@models/FHIR/searchParameter/registry/diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const def of definitions) {
        const compileResult = compileDefinition(def);
        diagnostics.push(...compileResult.diagnostics);
        const activated = applyActivationOverlay(def, {
            compilable: compileResult.compilable,
            reason: compileResult.reason
        });
        if (compileResult.lookupPlans) {
            activated.lookupPlans = compileResult.lookupPlans;
        }
        compiledDefinitions.push(activated);
    }

    const merged = mergeDefinitions(compiledDefinitions);
    diagnostics.push(...merged.diagnostics);
    return buildRegistrySnapshot({
        definitions: merged.definitions,
        diagnostics,
        version: 1
    });
}

describe("SearchParameter DB overlay and activation policy", function () {
    it("activates a compilable active database SearchParameter", function () {
        const custom = definition(
            {
                url: "http://example.org/SearchParameter/custom-active",
                status: "active",
                code: "custom-active",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            "database",
            ["Patient::custom-active"]
        );
        const snapshot = buildSnapshot([custom]);
        const effective = getEffectiveDefinition(snapshot, "Patient", "custom-active");

        expect(resolveLookupStatus(snapshot, "Patient", "custom-active")).to.equal("effective");
        expect(effective).to.not.equal(null);
        expect(effective.source).to.equal("database");
        expect(effective.resource.status).to.equal("active");
    });

    it("applies database overlay for the same canonical url/version", function () {
        const canonicalUrl = "http://example.org/SearchParameter/shared-canonical";
        const builtin = definition(
            {
                url: canonicalUrl,
                status: "active",
                code: "overlay-code",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            "builtin-bundle",
            ["Patient::overlay-code"]
        );
        const database = definition(
            {
                url: canonicalUrl,
                status: "active",
                code: "overlay-code",
                base: ["Patient"],
                type: "token",
                expression: "Patient.gender"
            },
            "database",
            ["Patient::overlay-code"]
        );
        const snapshot = buildSnapshot([builtin, database]);
        const merged = snapshot.byCanonicalKey.get(`${canonicalUrl}::4.0.1`);

        expect(merged).to.not.equal(undefined);
        expect(merged.source).to.equal("database");
        expect(merged.resource.expression).to.equal("Patient.gender");
        expect(merged.resource.type).to.equal("token");
        expect(resolveLookupStatus(snapshot, "Patient", "overlay-code")).to.equal("effective");
        expect(
            snapshot.diagnostics.some((diagnostic) => diagnostic.code === "canonical-overlay")
        ).to.equal(true);
    });

    it("promotes trusted builtin draft without mutating raw status", function () {
        const draft = definition(
            {
                url: "http://example.org/SearchParameter/builtin-draft",
                status: "draft",
                code: "builtin-draft",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            "builtin-bundle",
            ["Patient::builtin-draft"]
        );
        const snapshot = buildSnapshot([draft]);
        const merged = snapshot.byCanonicalKey.get("http://example.org/SearchParameter/builtin-draft::4.0.1");

        expect(merged.effectiveStatus).to.equal("active");
        expect(merged.resource.status).to.equal("draft");
        expect(resolveLookupStatus(snapshot, "Patient", "builtin-draft")).to.equal("effective");
    });

    it("keeps database draft, retired, and unknown definitions disabled", function () {
        const statuses = ["draft", "retired", "unknown"];
        for (const status of statuses) {
            const disabled = definition(
                {
                    url: `http://example.org/SearchParameter/db-${status}`,
                    status,
                    code: `db-${status}`,
                    base: ["Patient"],
                    type: "string",
                    expression: "Patient.name"
                },
                "database",
                [`Patient::db-${status}`]
            );
            const snapshot = buildSnapshot([disabled]);
            const merged = snapshot.byCanonicalKey.get(
                `http://example.org/SearchParameter/db-${status}::4.0.1`
            );

            expect(merged.effectiveStatus).to.equal("disabled");
            expect(resolveLookupStatus(snapshot, "Patient", `db-${status}`)).to.equal("disabled");
            expect(
                merged.diagnostics.some((diagnostic) => diagnostic.code === "status-not-activatable")
            ).to.equal(true);
        }
    });

    it("disables builtin retired and unknown definitions", function () {
        for (const status of ["retired", "unknown"]) {
            const disabled = definition(
                {
                    url: `http://example.org/SearchParameter/builtin-${status}`,
                    status,
                    code: `builtin-${status}`,
                    base: ["Patient"],
                    type: "string",
                    expression: "Patient.name"
                },
                "builtin-bundle",
                [`Patient::builtin-${status}`]
            );
            const snapshot = buildSnapshot([disabled]);
            const merged = snapshot.byCanonicalKey.get(
                `http://example.org/SearchParameter/builtin-${status}::4.0.1`
            );

            expect(merged.effectiveStatus).to.equal("disabled");
            expect(resolveLookupStatus(snapshot, "Patient", `builtin-${status}`)).to.equal(
                "disabled"
            );
        }
    });

    it("disables all active definitions that share a lookup key", function () {
        const first = definition(
            {
                url: "http://example.org/SearchParameter/conflict-a",
                status: "active",
                code: "conflict-code",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            "builtin-bundle",
            ["Patient::conflict-code"]
        );
        const second = definition(
            {
                url: "http://example.org/SearchParameter/conflict-b",
                status: "active",
                code: "conflict-code",
                base: ["Patient"],
                type: "string",
                expression: "Patient.gender"
            },
            "database",
            ["Patient::conflict-code"]
        );
        const snapshot = buildSnapshot([first, second]);

        expect(resolveLookupStatus(snapshot, "Patient", "conflict-code")).to.equal("disabled");
        expect(snapshot.conflictLookupKeys.has("Patient::conflict-code")).to.equal(true);
        expect(snapshot.byLookupKey.has("Patient::conflict-code")).to.equal(false);
        expect(
            snapshot.diagnostics.filter((diagnostic) => diagnostic.code === "lookup-conflict").length
        ).to.be.greaterThan(0);

        const conflicted = [...snapshot.byCanonicalKey.values()].filter((entry) =>
            entry.lookupKeys.includes("Patient::conflict-code")
        );
        expect(conflicted).to.have.length(2);
        for (const entry of conflicted) {
            expect(entry.effectiveStatus).to.equal("disabled");
            expect(entry.disableReason).to.include("conflict");
        }
    });

    it("reloads builtin definitions with an isolated database overlay", async function () {
        const snapshot = await reloadRegistry({
            databaseResources: [
                {
                    resourceType: "SearchParameter",
                    url: "http://example.org/SearchParameter/reload-overlay",
                    version: "4.0.1",
                    status: "active",
                    code: "reload-overlay",
                    base: ["Patient"],
                    type: "string",
                    expression: "Patient.name"
                }
            ]
        });

        expect(resolveLookupStatus(snapshot, "Patient", "reload-overlay")).to.equal("effective");
        const effective = getEffectiveDefinition(snapshot, "Patient", "reload-overlay");
        expect(effective).to.not.equal(null);
        expect(effective.source).to.equal("database");
    });
});
