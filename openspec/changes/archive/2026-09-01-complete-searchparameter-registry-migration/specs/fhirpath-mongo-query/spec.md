## ADDED Requirements

### Requirement: Every SearchParameter lookup SHALL have an explicit compiler outcome

For every `(resourceType, code)` lookup derived from the canonical SearchParameter source, the compiler SHALL produce exactly one outcome: an executable typed `SearchQueryPlan`, an explicitly supported unsupported classification, or a diagnostic-backed disabled outcome. A missing fixture, parser ambiguity, or unclassified capability failure MUST NOT be treated as success and MUST NOT trigger legacy behavior.

#### Scenario: Record a compiled lookup
- **WHEN** an expression is valid for a resource type and all required search-type projections are available
- **THEN** the compiler SHALL produce an independent typed plan for that lookup with its extraction paths, predicates, operators, and multiplicity semantics

#### Scenario: Record an unsupported lookup
- **WHEN** a lookup uses an explicitly unsupported SearchParameter type or expression feature
- **THEN** the compiler SHALL record a stable unsupported reason and SHALL produce no executable filter for that lookup

#### Scenario: Reject an unclassified compiler failure
- **WHEN** a lookup cannot be parsed, validated, typed, or projected and the failure is not covered by the unsupported policy
- **THEN** compilation verification SHALL fail with the resource, code, expression, and failure reason

### Requirement: SearchQueryPlan semantics SHALL be consistent across search entry points

Normal search, conditional delete, Bundle GET search validation, and controlled reference-chain evaluation SHALL use the same Registry-derived lookup semantics for a `(resourceType, code)`. They MUST NOT derive field paths, target types, operators, or value parsing from a reduced legacy parameter snapshot.

#### Scenario: Apply a plan to normal search
- **WHEN** a client searches a resource using an effective lookup
- **THEN** the executor SHALL apply that lookup's typed plan and declared FHIR value semantics

#### Scenario: Apply a plan to conditional delete
- **WHEN** a conditional delete uses an effective SearchParameter lookup
- **THEN** the delete filter SHALL be produced from the same typed plan and SHALL have the same matching semantics as normal search

#### Scenario: Validate Bundle GET search parameters
- **WHEN** a Bundle operation contains a GET entry with search parameters
- **THEN** parameter validation and filter construction SHALL use Registry lookup metadata and SHALL reject disabled, unsupported, or unknown lookups without legacy fallback

#### Scenario: Reject a legacy-only lookup
- **WHEN** a search entry point receives a code that exists only in the removed legacy snapshot
- **THEN** the request SHALL return the standard unknown or unsupported error and SHALL NOT construct a filter from the legacy snapshot

### Requirement: Controlled reference operations SHALL preserve correlated and bounded semantics

Reference extraction used by normal search, `_include`, `_revinclude`, conditional delete, and one-level chain SHALL preserve the typed target metadata and same-array-element correlation defined by the Registry plan. Runtime MUST reject undeclared targets, unsupported reference values, and relations beyond the configured depth or cost.

#### Scenario: Include a declared reference target
- **WHEN** `_include` requests a reference whose source and target are declared by Registry metadata
- **THEN** the operation SHALL resolve only the declared reference path and target resource type

#### Scenario: Reverse include by declared reference metadata
- **WHEN** `_revinclude` requests a declared target relationship
- **THEN** the operation SHALL use Registry reference metadata and SHALL reject an undeclared relationship

#### Scenario: Correlate a reference array element
- **WHEN** a reference array element contains both a reference value and a target-type guard
- **THEN** matching SHALL require both conditions on the same array element and MUST NOT combine values from separate elements

#### Scenario: Reject an unbounded relation
- **WHEN** a client requests an undeclared chain, recursive chain, unsupported reference form, or relation exceeding depth/cost limits
- **THEN** the API SHALL return the standard invalid or unknown search parameter error and SHALL NOT execute an unbounded aggregation

### Requirement: Search type contracts SHALL be verified for every compiled lookup

Each compiled lookup SHALL be verified against its declared search type, available modifiers, comparators, `multipleOr`, `multipleAnd`, and missing-value semantics. Query combinations outside the capability matrix MUST fail explicitly rather than silently changing conjunction or projection behavior.

#### Scenario: Verify positive and companion negative hit-sets
- **WHEN** a compiled lookup is included in the migration manifest
- **THEN** verification SHALL assert at least one expected hit and one companion document that does not match

#### Scenario: Verify missing-value semantics
- **WHEN** a compiled lookup supports the `:missing` modifier
- **THEN** verification SHALL distinguish the absence of a searchable projected value from the presence of at least one such value

#### Scenario: Verify declared operators and multiplicity
- **WHEN** a test exercises a compiled lookup
- **THEN** verification SHALL cover the declared comparator/modifier and applicable `multipleOr`/`multipleAnd` behavior, or record why the capability is not applicable

#### Scenario: Reject an undeclared query combination
- **WHEN** a client uses an undeclared modifier, comparator, or multiplicity form
- **THEN** query validation SHALL return the standard invalid search parameter/value error and SHALL NOT silently downgrade the request
