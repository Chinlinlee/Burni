---
status: accepted
---

# Separate SearchParameter tests by responsibility

SearchParameter tests are organized by the behavior they verify. SearchParameter remains the primary domain boundary, with compiler, executor, registry, runtime, migration, and integration responsibilities separated beneath it. Repository-wide architecture gates are kept in a dedicated architecture area because they scan and protect the whole repository rather than exercising one SearchParameter runtime component.

Patient service tests are split by behavior. CRUD coverage belongs to the general FHIR service integration scope, while tests that invoke the Patient search service to verify Registry lookup semantics remain SearchParameter service-level search integration. Shared test infrastructure is separated from domain-specific setup so Mongo lifecycle, fake HTTP objects, Patient service adapters, and Registry setup do not become one coupled helper.

## Considered Options

- Keep all tests directly under `test/searchParameter`. Rejected: test responsibility and repository-wide architecture gates remain indistinguishable.
- Organize only by test technology such as unit and integration. Rejected: SearchParameter contracts become separated from the domain they protect, and resource-specific integration tests become ambiguous.
- Move the complete Patient service test into general Patient integration. Rejected: most of that file verifies SearchParameter Registry search semantics rather than CRUD behavior.
- Keep one helper containing Mongo, HTTP, Patient service, and Registry setup. Rejected: unrelated tests inherit setup they do not need and shared support becomes coupled to one domain.

## Consequences

- Mocha continues to discover all tests through the recursive test pattern.
- Moving architecture gates requires updating repository-root calculations, scan allowlists, and path-sensitive assertions.
- Patient search integration remains an explicit SearchParameter contract while CRUD smoke coverage has a general FHIR service location.
- Shared support has narrower responsibilities, so callers must compose generic Mongo setup with Registry or Patient-specific setup when needed.
- The diagnostics gate command must reference the migration subdirectory after the move.
