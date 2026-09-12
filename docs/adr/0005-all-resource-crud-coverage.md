---
status: accepted
---

# Cover create/read for every FHIR resource

Burni's FHIR resource catalog contains 146 resource types, and each type has a
corresponding MongoDB model. The existing generic create and read services are
the production boundary; the missing contract is a repeatable integration
check that proves each resource can survive a create/read round-trip.

## Decision

- Define all-resource CRUD coverage from `models/FHIR/fhir.resourceList.json`.
- Add one general FHIR service integration test file that produces one named
  test per catalog resource. Keep the existing Patient-specific CRUD test as a
  regression test.
- Invoke `CreateService` and `ReadService` directly, matching the existing
  service integration-test boundary rather than introducing an HTTP client.
- Use each resource's active fixture from the fixture archive without
  modifying the archived file. Archive provenance selects a designated
  synthetic fixture first, then a derived fixture, then an official fixture.
  Companion fixtures are auxiliary and are not create payloads.
- Treat a fixture whose `resourceType` does not match the catalog entry, or
  whose create operation fails, as a test failure. Do not silently repair,
  downgrade, or skip the resource.
- Preserve the current create behavior of replacing a supplied resource ID
  with a generated UUID. Read the resource using the returned ID.
- Run the CRUD suite with remote profile validation disabled and restore the
  prior environment value afterward. This suite verifies persistence and
  service behavior, not remote Validator availability.
- Verify that the read result preserves the created resource type, returned
  identity, and resource content. Server-managed metadata differences are
  allowed.
- Start one MongoDB memory server for the suite and isolate each resource's
  collection between tests.

## Production boundary

The implementation should first exercise the existing generic services and
change production code only when a failing all-resource test demonstrates a
real service or model defect. Test support may provide generic resource
adapters, but assertions remain in the integration test.

## Consequences

- A new resource added to `models/FHIR/fhir.resourceList.json` automatically
  becomes a required named CRUD integration case after
  `EXPECTED_RESOURCE_COUNT` in `test/support/fhir/resource-catalog.js` is
  updated to the new catalog size. No new test file is required.
- Missing fixture provenance, a missing active fixture, a `resourceType`
  mismatch, or an unregistered MongoDB model fails that resource's case and
  names the resource type in the diagnostic.
- Fixture provenance and schema regressions fail loudly instead of becoming
  unreported coverage gaps.
- The suite does not prove remote profile validation, HTTP routing, search
  behavior, or update/delete semantics.
- The full suite may expose resource-specific persistence side effects that
  Patient-only tests do not cover.
- Run the targeted suite with `npm run test:all-resource-crud`. Run the full
  Mocha suite with `npm test` and lint with `npm run lint`.
