## MODIFIED Requirements

### Requirement: Registry SHALL preserve search API compatibility during migration

Registry SHALL be the sole effective runtime definition path for every production resource type. The runtime MUST NOT load generated SearchParameter handlers, `FHIRParametersClean.json`, or any other legacy SearchParameter definition source. Effective definitions SHALL use their compiled Registry plan; disabled, conflicted, unsupported, or otherwise unavailable definitions SHALL use the existing unknown search parameter error flow and MUST NOT fall back to legacy behavior.

#### Scenario: Search with an effective registry definition
- **WHEN** a client uses a `(resourceType, code)` lookup present in the effective Registry snapshot
- **THEN** runtime SHALL execute that lookup's compiled Registry plan and MUST NOT call a generated legacy handler

#### Scenario: Search with a disabled definition
- **WHEN** a client uses a SearchParameter that is present in the source but disabled, conflicted, or explicitly unsupported
- **THEN** API SHALL treat it as an unknown or unsupported search parameter according to the existing error contract and MUST NOT execute a legacy fallback

#### Scenario: Search with a completely unknown code
- **WHEN** a client uses a code that is not present in the Registry source or disabled/conflict index
- **THEN** API SHALL return the existing unknown search parameter error and MUST NOT consult a generated handler

#### Scenario: Preserve the compatibility boundary
- **WHEN** Registry executes a search whose projection has a documented compatibility-plus-corrections boundary
- **THEN** behavior SHALL preserve the existing valid public projection boundary while applying approved corrections, and MUST NOT claim unsupported full R4 semantics

#### Scenario: Compare legacy and registry behavior
- **WHEN** a migration-only verification process compares a historical legacy result with a Registry result
- **THEN** the comparison SHALL be diagnostic-only, MUST NOT alter the Registry plan or runtime result, and SHALL not be required after legacy removal

#### Scenario: Do not gate enablement on shadow filter equality
- **WHEN** Registry correctness tests pass but a migration-only comparison reports a filter mismatch caused by a known legacy defect
- **THEN** the resource SHALL remain eligible for enablement, provided all Registry gates pass, and the mismatch SHALL remain diagnostic-only

#### Scenario: Enable a resource type with registry correctness tests
- **WHEN** a resource type has passed its SearchQueryPlan golden filter tests, document fixture tests, and applicable diagnostics gates
- **THEN** it SHALL be enabled for Registry-first search without requiring legacy filter equality

### Requirement: Registry SHALL enable every production resource without legacy fallback

Every resource type listed in the production resource catalog SHALL have a final Registry outcome. A resource with no SearchParameter lookup SHALL pass a structural Registry gate. A resource with SearchParameter lookups SHALL enable only after every lookup is either compiled and gated or explicitly classified as unsupported with a stable diagnostic; missing fixture data alone MUST NOT create an implicit skip or fallback.

#### Scenario: Enable a resource with compiled lookups
- **WHEN** every applicable lookup for a resource has a valid per-lookup plan and passes its golden and document hit-set gates
- **THEN** that resource SHALL be enabled for Registry-first search

#### Scenario: Enable a resource with no SearchParameters
- **WHEN** a production resource has no effective or unsupported SearchParameter lookup
- **THEN** it SHALL pass a structural Registry gate and SHALL not require a search hit-set

#### Scenario: Reject incomplete resource enablement
- **WHEN** a resource has an unclassified compiler failure, missing lookup outcome, unresolved conflict, or untracked fixture gap
- **THEN** the resource MUST NOT be enabled and the diagnostics SHALL identify the blocking lookup and reason

#### Scenario: Keep unsupported lookups explicit
- **WHEN** a lookup is `composite`, `special`, expressionless, or outside the approved compiler capability
- **THEN** Registry SHALL record a stable unsupported diagnostic, expose no executable plan for that lookup, and MUST NOT use legacy fallback

### Requirement: Migration fixtures and manifest SHALL be reproducible

Migration verification SHALL use one explicitly mapped official example per resource when available. Original examples SHALL remain unchanged; derived or synthetic fixtures SHALL be stored in the version-controlled fixture archive with their origin and augmentation recorded. A committed manifest SHALL identify the source bundle, lookup, compiled plan outcome, fixture provenance, and expected hit-set for each applicable lookup.

#### Scenario: Use a fixed official example
- **WHEN** a resource has an approved official example mapping
- **THEN** the migration test SHALL use that mapped file, verify its resource type and recorded hash, and MUST NOT silently select a different example

#### Scenario: Augment an incomplete example
- **WHEN** the mapped example lacks a value required to exercise a compiled lookup
- **THEN** the test suite SHALL use a derived or synthetic fixture that records the augmentation and SHALL preserve the original example

#### Scenario: Cover a resource without an official example
- **WHEN** no official example is available for a production resource
- **THEN** the migration archive SHALL provide a minimal valid synthetic fixture identified as synthetic so the resource can satisfy its applicable Registry gates

#### Scenario: Verify a lookup hit-set
- **WHEN** a compiled lookup is included in the migration manifest
- **THEN** its test SHALL assert the expected positive hit-set and companion negative hit-set, plus applicable missing-value and declared operator/multiplicity behavior

### Requirement: Diagnostics SHALL enforce migration completion

The Registry diagnostics command SHALL report all source definitions and per-resource lookups with canonical identity, raw/effective status, compiler outcome, unsupported reason, conflict state, fixture provenance, and enablement state. Continuous verification SHALL fail when any lookup is unknown, conflicted, unclassified, or has a compiler failure that is not explicitly allowed by the unsupported policy.

#### Scenario: Produce a complete diagnostics report
- **WHEN** diagnostics runs against the canonical R4 Bundle and current DB overlay
- **THEN** the report SHALL account for every source definition and `(resourceType, code)` lookup without an unclassified outcome

#### Scenario: Fail on a newly introduced failure
- **WHEN** a source or compiler change creates an unknown lookup, active conflict, or unapproved compiler failure
- **THEN** diagnostics verification SHALL fail and identify the affected resource, code, source, and reason

#### Scenario: Retain diagnostics after rollout tooling removal
- **WHEN** Registry-first migration is complete
- **THEN** diagnostics SHALL remain available as an operational and CI command, while shadow comparison and rollout-status commands SHALL no longer be required

### Requirement: Legacy SearchParameter source SHALL be removed after migration gates

After all production resource gates, runtime call-site checks, diagnostics checks, and replacement tests pass, the system SHALL remove SearchParameter-specific legacy source and generated handler generation. Non-SearchParameter API generation and control-parameter behavior SHALL remain available.

#### Scenario: Remove legacy definition source
- **WHEN** no production runtime, build path, test contract, or diagnostic command requires `FHIRParametersClean.json`
- **THEN** the file SHALL be removed and no runtime or build command SHALL reference it

#### Scenario: Remove generated search handlers
- **WHEN** all normal search, chain, include/revinclude, conditional delete, and Bundle GET validation paths use Registry metadata or plans
- **THEN** generated `*ParametersHandler.js` files and their SearchParameter generation path SHALL be removed

#### Scenario: Preserve non-search API generation
- **WHEN** SearchParameter generation is removed
- **THEN** CRUD, history, validation, Bundle operations, response handling, pagination, summary, and other non-SearchParameter API behavior SHALL remain available

#### Scenario: Remove transitional commands
- **WHEN** no release or enablement decision depends on legacy comparison or rollout status
- **THEN** `search-parameter:shadow` and `search-parameter:rollout-status` SHALL be removed, while `search-parameter:diagnostics` SHALL remain
