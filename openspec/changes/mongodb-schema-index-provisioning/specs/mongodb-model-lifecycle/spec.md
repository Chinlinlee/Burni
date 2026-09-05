## ADDED Requirements

### Requirement: Keep provisioning readiness separate from application readiness

Application readiness SHALL continue to depend on model registration, database readiness and
SearchParameter registry readiness. Missing or drifted performance indexes SHALL NOT by itself
reject application readiness when provisioning was not explicitly requested.

#### Scenario: Start with default provisioning disabled

- **WHEN** application starts with provisioning opt-in disabled and required MongoDB performance
  indexes are missing
- **THEN** application SHALL preserve the existing readiness contract, SHALL log the index state,
  and SHALL NOT treat the missing performance indexes as a database connection failure

#### Scenario: Application startup after external provisioning

- **WHEN** an external provisioning operation completes successfully before application startup
- **THEN** application SHALL use the existing model and database readiness flow without repeating
  provisioning implicitly

### Requirement: Support explicit startup provisioning

Application SHALL support an explicit opt-in mode in which provisioning uses the same desired
manifest, lock and failure contract as the independent provisioning operation. When this mode is
enabled, application readiness SHALL wait for provisioning completion.

#### Scenario: Explicit startup provisioning succeeds

- **WHEN** application starts with provisioning opt-in enabled and collection/index provisioning
  completes successfully
- **THEN** application SHALL continue to the existing SearchParameter readiness flow and may
  become ready only after provisioning has completed

#### Scenario: Explicit startup provisioning fails

- **WHEN** application starts with provisioning opt-in enabled and provisioning fails
- **THEN** application SHALL NOT declare application ready, SHALL NOT start HTTP listening, and
  SHALL expose a non-zero startup result through the server bootstrap

### Requirement: Preserve synchronous model access during provisioning

Model registration SHALL remain synchronously available through the existing model map even when
provisioning or database readiness is still pending. Provisioning state SHALL NOT be represented
as enumerable model entries.

#### Scenario: Access models before provisioning completes

- **WHEN** model registration succeeds but collection/index provisioning or database readiness is
  still pending
- **THEN** existing callers SHALL be able to resolve models synchronously, while readiness state
  remains separately awaitable
