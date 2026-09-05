require("module-alias/register");

const { expect } = require("chai");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { validateOperator } = require("@models/FHIR/searchParameter/compiler/capabilityMatrix");
const {
    evaluateLookupIndexPolicy,
    buildTokenKeyPatterns,
    buildReferenceKeyPatterns,
    buildStringKeyPatterns,
    buildNumberKeyPatterns,
    buildQuantityKeyPatterns,
    buildUriKeyPatterns,
    generateSearchParameterIndexManifestWithDiagnostics,
    getIndexIdentity,
    buildIndexName,
    validateSearchParameterIndexManifest,
    validateCompoundArrayCorrelation
} = require("@models/FHIR/searchParameter/indexes/nonTemporal");

function definition(canonicalKey, lookupKey, plan, options = {}) {
    return {
        canonicalKey,
        source: options.source || "builtin-bundle",
        effectiveStatus: options.effectiveStatus || "active",
        resource: {
            code: lookupKey.split("::")[1]
        },
        lookupPlans: {
            [lookupKey]: {
                compilable: true,
                plan
            }
        }
    };
}

function plan(resourceType, code, searchType, extractionPaths, extra = {}) {
    return createSearchQueryPlan({
        resourceType,
        code,
        searchType,
        extractionPaths,
        modifiers: extra.modifiers || [],
        comparators: extra.comparators || []
    });
}

describe("non-temporal SearchParameter derived index policy", function () {
    it("defines approved key patterns for six search types", function () {
        expect(buildTokenKeyPatterns("code", "Coding", [])).to.deep.equal([
            {
                keyPattern: "token-code-only",
                key: { "code.code": 1 },
                fields: ["code.code"]
            },
            {
                keyPattern: "token-system-code",
                key: { "code.system": 1, "code.code": 1 },
                fields: ["code.system", "code.code"]
            }
        ]);
        expect(buildReferenceKeyPatterns("subject", "Reference")).to.deep.equal([
            {
                keyPattern: "reference-stored-reference",
                key: { "subject.reference": 1 },
                fields: ["subject.reference"]
            }
        ]);
        expect(buildStringKeyPatterns("name", "HumanName").map((entry) => entry.keyPattern)).to.deep.equal(
            Array(5).fill("string-exact-leaf")
        );
        expect(buildNumberKeyPatterns("valueDecimal")).to.deep.equal([
            {
                keyPattern: "number-single-field",
                key: { valueDecimal: 1 },
                fields: ["valueDecimal"]
            }
        ]);
        expect(buildQuantityKeyPatterns("valueQuantity").map((entry) => entry.keyPattern)).to.deep.equal([
            "quantity-value-only",
            "quantity-system-code-value"
        ]);
        expect(buildUriKeyPatterns("url")).to.deep.equal([
            {
                keyPattern: "uri-raw-single-field",
                key: { url: 1 },
                fields: ["url"]
            }
        ]);
    });

    it("rejects unsupported number and quantity comparators in capability matrix", function () {
        for (const comparator of ["sa", "eb", "ap"]) {
            expect(validateOperator("number", undefined, comparator).valid).to.equal(false);
            expect(validateOperator("quantity", undefined, comparator).valid).to.equal(false);
        }
        expect(validateOperator("number", undefined, "gt").valid).to.equal(true);
    });

    it("excludes custom, disabled, composite, and unsupported token shapes", function () {
        const custom = evaluateLookupIndexPolicy({
            definition: definition(
                "custom",
                "Observation::custom",
                plan("Observation", "custom", "token", [{ path: "code", datatype: "CodeableConcept" }]),
                { source: "database" }
            ),
            lookupKey: "Observation::custom",
            plan: plan("Observation", "custom", "token", [{ path: "code", datatype: "CodeableConcept" }])
        });
        expect(custom.approved).to.equal(false);
        expect(custom.diagnostics[0].code).to.equal("custom-search-parameter-excluded");

        const disabled = evaluateLookupIndexPolicy({
            definition: definition(
                "disabled",
                "Patient::disabled",
                plan("Patient", "disabled", "string", [{ path: "name.family", datatype: "string" }]),
                { effectiveStatus: "disabled" }
            ),
            lookupKey: "Patient::disabled",
            plan: plan("Patient", "disabled", "string", [{ path: "name.family", datatype: "string" }])
        });
        expect(disabled.approved).to.equal(false);

        const composite = evaluateLookupIndexPolicy({
            definition: definition(
                "composite",
                "Observation::combo",
                plan("Observation", "combo", "composite", [{ path: "component", datatype: "BackboneElement" }])
            ),
            lookupKey: "Observation::combo",
            plan: plan("Observation", "combo", "composite", [{ path: "component", datatype: "BackboneElement" }])
        });
        expect(composite.approved).to.equal(false);

        const deceasedToken = evaluateLookupIndexPolicy({
            definition: definition(
                "deceased",
                "Patient::deceased",
                plan("Patient", "deceased", "token", [
                    {
                        path: "deceasedBoolean",
                        datatype: "boolean",
                        predicates: [{ kind: "deceasedPresence" }]
                    }
                ])
            ),
            lookupKey: "Patient::deceased",
            plan: plan("Patient", "deceased", "token", [
                {
                    path: "deceasedBoolean",
                    datatype: "boolean",
                    predicates: [{ kind: "deceasedPresence" }]
                }
            ])
        });
        expect(deceasedToken.approved).to.equal(false);
    });

    it("emits stable diagnostics for non-compilable and disabled lookups without executable plans", function () {
        const nonCompilable = generateSearchParameterIndexManifestWithDiagnostics([
            {
                canonicalKey: "non-compilable",
                source: "builtin-bundle",
                effectiveStatus: "active",
                resource: {
                    code: "broken",
                    type: "token"
                },
                lookupPlans: {
                    "Observation::broken": {
                        compilable: false
                    }
                }
            }
        ]);
        expect(nonCompilable.manifest.indexes).to.have.length(0);
        expect(nonCompilable.diagnostics.some((entry) => entry.includes("lookup-not-compilable"))).to
            .equal(true);

        const disabled = generateSearchParameterIndexManifestWithDiagnostics([
            {
                canonicalKey: "disabled",
                source: "builtin-bundle",
                effectiveStatus: "disabled",
                resource: {
                    code: "inactive",
                    type: "string"
                },
                lookupPlans: {
                    "Patient::inactive": {
                        compilable: false
                    }
                }
            }
        ]);
        expect(disabled.manifest.indexes).to.have.length(0);
        expect(disabled.diagnostics.some((entry) => entry.includes("lookup-disabled"))).to.equal(true);
    });
});

describe("non-temporal token derived index policy", function () {
    it("covers Coding, CodeableConcept, Identifier, and ContactPoint correlation", function () {
        const coding = evaluateLookupIndexPolicy({
            definition: definition(
                "coding",
                "Observation::coding",
                plan("Observation", "coding", "token", [{ path: "code", datatype: "Coding" }])
            ),
            lookupKey: "Observation::coding",
            plan: plan("Observation", "coding", "token", [{ path: "code", datatype: "Coding" }])
        });
        expect(coding.approved).to.equal(true);
        expect(coding.specs.map((entry) => entry.keyPattern)).to.include.members([
            "token-code-only",
            "token-system-code"
        ]);

        const identifier = evaluateLookupIndexPolicy({
            definition: definition(
                "identifier",
                "Patient::identifier",
                plan("Patient", "identifier", "token", [{ path: "identifier", datatype: "Identifier" }])
            ),
            lookupKey: "Patient::identifier",
            plan: plan("Patient", "identifier", "token", [{ path: "identifier", datatype: "Identifier" }])
        });
        expect(identifier.specs.map((entry) => entry.keyPattern)).to.include.members([
            "token-value-only",
            "token-system-value"
        ]);

        const correlatedContact = evaluateLookupIndexPolicy({
            definition: definition(
                "telecom",
                "Patient::telecom",
                plan("Patient", "telecom", "token", [
                    {
                        path: "telecom",
                        datatype: "ContactPoint",
                        predicates: [{ kind: "systemEquals", value: "phone" }]
                    }
                ])
            ),
            lookupKey: "Patient::telecom",
            plan: plan("Patient", "telecom", "token", [
                {
                    path: "telecom",
                    datatype: "ContactPoint",
                    predicates: [{ kind: "systemEquals", value: "phone" }]
                }
            ])
        });
        expect(correlatedContact.specs).to.have.length(1);
        expect(correlatedContact.specs[0].keyPattern).to.equal("token-system-value");
        expect(correlatedContact.specs[0].compatibility.unsupportedModes).to.include("text");
    });
});

describe("non-temporal reference, string, number, quantity, and uri policy", function () {
    it("indexes stored reference without using Reference.type", function () {
        const result = evaluateLookupIndexPolicy({
            definition: definition(
                "subject",
                "Observation::subject",
                plan("Observation", "subject", "reference", [
                    { path: "subject", datatype: "Reference", referenceTargetType: "Patient" }
                ])
            ),
            lookupKey: "Observation::subject",
            plan: plan("Observation", "subject", "reference", [
                { path: "subject", datatype: "Reference", referenceTargetType: "Patient" }
            ])
        });
        expect(result.specs[0].key).to.deep.equal({ "subject.reference": 1 });
        expect(result.specs[0].key).to.not.have.property("subject.type");
    });

    it("creates separate exact string leaves for Address and HumanName", function () {
        const result = evaluateLookupIndexPolicy({
            definition: definition(
                "address",
                "Patient::address",
                plan("Patient", "address", "string", [{ path: "address", datatype: "Address" }], {
                    modifiers: ["exact"]
                })
            ),
            lookupKey: "Patient::address",
            plan: plan("Patient", "address", "string", [{ path: "address", datatype: "Address" }], {
                modifiers: ["exact"]
            })
        });
        expect(result.specs).to.have.length(6);
        expect(result.specs.every((entry) => entry.keyPattern === "string-exact-leaf")).to.equal(true);
        expect(result.specs[0].compatibility.unsupportedModes).to.include("contains");
    });

    it("excludes default-prefix and contains string lookups from the manifest", function () {
        const defaultPrefix = evaluateLookupIndexPolicy({
            definition: definition(
                "name",
                "Patient::name",
                plan("Patient", "name", "string", [{ path: "name", datatype: "HumanName" }])
            ),
            lookupKey: "Patient::name",
            plan: plan("Patient", "name", "string", [{ path: "name", datatype: "HumanName" }])
        });
        expect(defaultPrefix.approved).to.equal(false);
        expect(defaultPrefix.specs || []).to.have.length(0);
        expect(defaultPrefix.diagnostics.map((entry) => entry.code)).to.include(
            "string-prefix-not-indexed"
        );

        const contains = evaluateLookupIndexPolicy({
            definition: definition(
                "name",
                "Patient::name",
                plan("Patient", "name", "string", [{ path: "name", datatype: "HumanName" }], {
                    modifiers: ["contains"]
                })
            ),
            lookupKey: "Patient::name",
            plan: plan("Patient", "name", "string", [{ path: "name", datatype: "HumanName" }], {
                modifiers: ["contains"]
            })
        });
        expect(contains.approved).to.equal(false);
        expect(contains.specs || []).to.have.length(0);
        expect(contains.diagnostics.map((entry) => entry.code)).to.include(
            "string-contains-not-indexed"
        );
    });

    it("uses numeric BSON paths for number and quantity without normalization fields", function () {
        const number = evaluateLookupIndexPolicy({
            definition: definition(
                "probability",
                "RiskAssessment::probability",
                plan("RiskAssessment", "probability", "number", [
                    { path: "probabilityDecimal", datatype: "decimal" }
                ])
            ),
            lookupKey: "RiskAssessment::probability",
            plan: plan("RiskAssessment", "probability", "number", [
                { path: "probabilityDecimal", datatype: "decimal" }
            ])
        });
        expect(number.specs[0].key).to.deep.equal({ probabilityDecimal: 1 });

        const quantity = evaluateLookupIndexPolicy({
            definition: definition(
                "value-quantity",
                "Observation::value-quantity",
                plan("Observation", "value-quantity", "quantity", [
                    { path: "valueQuantity", datatype: "Quantity" }
                ])
            ),
            lookupKey: "Observation::value-quantity",
            plan: plan("Observation", "value-quantity", "quantity", [
                { path: "valueQuantity", datatype: "Quantity" }
            ])
        });
        expect(quantity.specs.map((entry) => entry.keyPattern)).to.deep.equal([
            "quantity-value-only",
            "quantity-system-code-value"
        ]);
    });

    it("shares raw URI identity across exact, above, and below modes", function () {
        const result = evaluateLookupIndexPolicy({
            definition: definition(
                "url",
                "ValueSet::url",
                plan("ValueSet", "url", "uri", [{ path: "url", datatype: "uri" }], {
                    modifiers: ["below", "above"]
                })
            ),
            lookupKey: "ValueSet::url",
            plan: plan("ValueSet", "url", "uri", [{ path: "url", datatype: "uri" }], {
                modifiers: ["below", "above"]
            })
        });
        expect(result.specs).to.have.length(1);
        expect(result.specs[0].compatibility.indexedModes).to.deep.equal(["exact", "above", "below"]);
    });
});

describe("non-temporal array and choice safety", function () {
    it("accepts a single correlated array branch", function () {
        const result = evaluateLookupIndexPolicy({
            definition: definition(
                "category",
                "Observation::category",
                plan("Observation", "category", "token", [
                    {
                        path: "category",
                        datatype: "CodeableConcept",
                        arrayPaths: ["category"]
                    }
                ])
            ),
            lookupKey: "Observation::category",
            plan: plan("Observation", "category", "token", [
                {
                    path: "category",
                    datatype: "CodeableConcept",
                    arrayPaths: ["category"]
                }
            ])
        });
        expect(result.approved).to.equal(true);
        expect(result.specs[0].compatibility.requiresElementCorrelation).to.equal(true);
    });

    it("rejects parallel multikey and positional array paths", function () {
        const parallel = evaluateLookupIndexPolicy({
            definition: definition(
                "unsafe",
                "CarePlan::unsafe",
                plan("CarePlan", "unsafe", "string", [
                    {
                        path: "activity.detail.text",
                        datatype: "string",
                        arrayPaths: ["activity", "goal"]
                    }
                ], {
                    modifiers: ["exact"]
                })
            ),
            lookupKey: "CarePlan::unsafe",
            plan: plan("CarePlan", "unsafe", "string", [
                {
                    path: "activity.detail.text",
                    datatype: "string",
                    arrayPaths: ["activity", "goal"]
                }
            ], {
                modifiers: ["exact"]
            })
        });
        expect(parallel.approved).to.equal(false);
        expect(parallel.diagnostics.map((entry) => entry.code)).to.include("parallel-multikey-paths");

        const positional = evaluateLookupIndexPolicy({
            definition: definition(
                "positional",
                "Observation::positional",
                plan("Observation", "positional", "number", [
                    { path: "component.0.valueInteger", datatype: "integer" }
                ])
            ),
            lookupKey: "Observation::positional",
            plan: plan("Observation", "positional", "number", [
                { path: "component.0.valueInteger", datatype: "integer" }
            ])
        });
        expect(positional.approved).to.equal(false);
        expect(positional.diagnostics.map((entry) => entry.code)).to.include(
            "positional-array-path-unsupported"
        );
    });

    it("rejects compound indexes whose fields bind to different multikey paths", function () {
        const crossBranch = validateCompoundArrayCorrelation(
            ["component.code.coding.system", "reference.reference"],
            ["component", "reference"],
            "component.code.coding.system"
        );
        expect(crossBranch.valid).to.equal(false);
        expect(crossBranch.diagnostics.map((entry) => entry.code)).to.include("array-path-mismatch");

        const nested = validateCompoundArrayCorrelation(
            ["category.coding.system", "category.coding.code"],
            ["category"],
            "category"
        );
        expect(nested.valid).to.equal(true);
        expect(nested.indexedArrayPaths).to.deep.equal(["category", "category"]);
    });

    it("keeps choice branches as separate deterministic identities", function () {
        const generated = generateSearchParameterIndexManifestWithDiagnostics([
            definition(
                "choice",
                "Observation::choice",
                plan("Observation", "choice", "string", [
                    { path: "valueString", datatype: "string" },
                    { path: "valueMarkdown", datatype: "markdown" }
                ], {
                    modifiers: ["exact"]
                })
            )
        ]);
        expect(generated.manifest.indexes.length).to.equal(2);
        const identities = new Set(generated.manifest.indexes.map((entry) => entry.identity));
        expect(identities.size).to.equal(2);
    });
});

describe("non-temporal manifest determinism", function () {
    it("deduplicates equivalent keys and preserves provenance", function () {
        const sharedPlan = plan("Patient", "gender", "token", [
            { path: "gender", datatype: "code" }
        ]);
        const generated = generateSearchParameterIndexManifestWithDiagnostics([
            definition("gender-a", "Patient::gender", sharedPlan),
            definition("gender-b", "Patient::gender-alias", sharedPlan)
        ]);
        const singleFieldEntries = generated.manifest.indexes.filter(
            (entry) => entry.keyPattern === "token-single-field"
        );
        expect(singleFieldEntries).to.have.length(1);
        expect(singleFieldEntries[0].sources.lookupKeys).to.include.members([
            "Patient::gender",
            "Patient::gender-alias"
        ]);
    });

    it("produces deterministic physical names and checksum-stable identity", function () {
        const spec = evaluateLookupIndexPolicy({
            definition: definition(
                "status",
                "Observation::status",
                plan("Observation", "status", "token", [{ path: "status", datatype: "code" }])
            ),
            lookupKey: "Observation::status",
            plan: plan("Observation", "status", "token", [{ path: "status", datatype: "code" }])
        }).specs[0];

        const identity = getIndexIdentity(spec);
        const name = buildIndexName(spec);
        expect(name.startsWith("fhir_sp_token_")).to.equal(true);
        expect(getIndexIdentity(spec)).to.equal(identity);
        expect(buildIndexName(spec)).to.equal(name);

        const manifest = generateSearchParameterIndexManifestWithDiagnostics([
            definition(
                "status",
                "Observation::status",
                plan("Observation", "status", "token", [{ path: "status", datatype: "code" }])
            )
        ]).manifest;
        expect(validateSearchParameterIndexManifest(manifest).valid).to.equal(true);
    });

    it("rejects manifest entries with unsupported index options", function () {
        const manifest = generateSearchParameterIndexManifestWithDiagnostics([
            definition(
                "status",
                "Observation::status",
                plan("Observation", "status", "token", [{ path: "status", datatype: "code" }])
            )
        ]).manifest;
        manifest.indexes[0].options = { background: true, sparse: true };
        expect(validateSearchParameterIndexManifest(manifest).valid).to.equal(false);
    });
});
