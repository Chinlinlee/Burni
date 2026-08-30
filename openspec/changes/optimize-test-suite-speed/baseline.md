# Test suite speed baseline

Recorded on **2026-08-30** on Windows (Node.js v24.14.1) before profile wiring and shared MongoDB lifecycle work (OpenSpec `optimize-test-suite-speed`, Section 1).

Environment notes:

- Commands use `mocha --no-config --require test/hook.js` unless noted.
- Wall-clock times include process startup, module loading, and Mocha reporter overhead.
- MongoDB suites currently start a **per-suite** `MongoMemoryServer` (no process-level reuse yet).

## Profile inventory

| Profile | Test files | Executable cases (Mocha dry-run / measured) | Notes |
| --- | ---: | ---: | --- |
| **Full** | 56 | ~594 (322 fast + 272 MongoDB dry-run) | Matches proposal order-of-magnitude (~570). Static `it(` scan: 395; catalog-driven CRUD adds 146 resource cases in `all-resource-crud.integration.test.js` (148 total in that file). |
| **Fast** | 41 | 322 measured (320 pass, 2 fail) | Excludes 15 MongoDB-dependent files. Static `it(` scan: 312; dynamic cases in enablement/diagnostics gates add cases at runtime. |
| **MongoDB-dependent** | 15 | 272 (dry-run) | See `test/support/test-profiles.js` → `MONGODB_DEPENDENT_FILES`. |

### Fast profile exclusion validation

`validateFastProfileIsolation()` in `test/support/test-profiles.js` returns `{ ok: true, violations: [] }`.

Fast profile excludes all suites that call:

- `startFhirCrudTestContext` (`test/support/fhir/crud-test-context.js`)
- `startMongoMemory` (`test/support/mongo-memory.js`)
- `startRegistryTestContext` (`test/searchParameter/support/registry-test-context.js`)
- `runIsolatedConnectorScenario` (`test/models/mongodb/connector-lifecycle.test.js` — child processes with `MongoMemoryServer`)

**Observation:** Running the fast profile still logs MongoDB connector/registry initialization during `test/api_generator/api-generator-search-decoupling.test.js` because that suite imports production modules that register models. This is incidental import cost, not inclusion of a MongoDB-dependent suite file. Section 2–3 will address lifecycle reuse separately.

## 146-resource CRUD coverage

| Metric | Value |
| --- | ---: |
| `EXPECTED_RESOURCE_COUNT` (`test/support/fhir/resource-catalog.js`) | **146** |
| Named create/read cases in `all-resource-crud.integration.test.js` (Mocha dry-run) | **148** (146 catalog resources + 2 catalog/provenance alignment checks) |
| Specimen included in catalog loop | **Yes** — same `it(\`creates and reads ${resourceType}...\`)` pattern as other resources |

## Specimen CRUD failure state

### Masking check (task 1.3)

| Check | Result |
| --- | --- |
| `it.skip` / `xit` / `xdescribe` for Specimen in `all-resource-crud.integration.test.js` | **None** |
| Specimen excluded from full profile glob | **No** — covered by `test/**/*.test.js` |
| `allowFailure` / CI allow-failure for Specimen | **None found** |
| Specimen handled differently from other catalog resources | **No** |

### Baseline execution (2026-08-30)

```text
npx mocha --no-config --require test/hook.js --timeout 600000 --exit \
  --grep "creates and reads Specimen" \
  test/integration/FHIR/all-resource-crud.integration.test.js
```

| Result | Detail |
| --- | --- |
| Exit code | **0** (pass) |
| Wall time | **162,787 ms** (~2.7 min) |
| Specimen case | `creates and reads Specimen through FHIR services` — **passed** (1893 ms case time after ~158 s MongoDB init) |
| Grep side effect | Also matched `SpecimenDefinition` (also passed) |

**Current state:** At baseline time, Specimen CRUD **passes** in isolation. OpenSpec design still defers the full-profile CI gate until Specimen is confirmed stable across full runs; this baseline records the observed pass and confirms the failure is **not** hidden by skip/exclude/allow-failure. Re-run the full `all-resource-crud` profile after lifecycle optimizations to confirm end-to-end stability.

## CI policy (Section 5.4)

| Gate | Status | Notes |
| --- | --- | --- |
| `test:diagnostics-gate` (`search-parameter-diagnostics.yml`) | **Required** on `main`, `next`, `dev` | Registry integrity only |
| `npm run test:full` | **Deferred** — manual / release entry | Not a required CI gate until Specimen CRUD is stable across full runs |
| `npm run test:all-resource-crud` | **Deferred** — standalone script | Same deferral; see Specimen section above |

Workflow comment: `.github/workflows/search-parameter-diagnostics.yml` documents that the full profile stays off CI until Specimen is stable.

## Timing infrastructure (Section 5.1)

Enable lifecycle output with `TEST_TIMING=1` (or `TEST_TIMING=true`). Implementation: `test/support/test-timing.js`, integrated in `test/hook.js` (process hook, per-suite, per-test) and `test/support/mongo-memory.js` (database startup / connect / teardown). Summary prints to stderr at process exit; does not change assertions or exit status.

## Timing measurements

### Fast profile (41 files, no MongoDB-dependent suite files)

```text
node -e "require('./test/support/test-profiles').buildFastProfileSpec()" | xargs mocha --no-config --require test/hook.js --timeout 300000 --exit
```

| Metric | Value |
| --- | ---: |
| Wall time | **164,830 ms** (~2.75 min) |
| Cases | 322 (320 pass, 2 fail) |
| Failures | `test/models/mongodb/fhir-datatypes.test.js` — partial date/dateTime precision assertions (pre-existing, no `MongoMemoryServer`) |

### Representative MongoDB suite — temporal round-trip

File: `test/integration/FHIR/temporal/round-trip.integration.test.js`

| Metric | Value |
| --- | ---: |
| Wall time | **160,818 ms** (~2.68 min) |
| Exit code | 0 |
| Cases | 3 passing |
| Logged MongoDB init | model registry ~9.6 s; SearchParameter registry ~143 s; **total init ~152 s** |
| Case execution (approx.) | ~3 s for 3 cases after init |

### Specimen CRUD (grep-focused all-resource-crud)

See [Specimen CRUD failure state](#specimen-crud-failure-state) above.

## Post-optimization measurements (Section 5.2)

Re-measured on **2026-08-30** on the same machine (Windows, Node.js v24.14.1) after profile wiring, shared MongoDB lifecycle, and `TEST_TIMING` instrumentation. Commands use `TEST_TIMING=1` unless noted.

### Fast profile — before vs after

| Metric | Before (Section 1) | After (Section 5) | Delta |
| --- | ---: | ---: | ---: |
| Wall time | 164,830 ms | **143,446 ms** | **−13%** (~21 s) |
| Cases | 322 (320 pass, 2 fail) | 322 (320 pass, 2 fail) | unchanged |
| MongoDB server starts | 0 (no MongoDB suite files) | 0 | — |
| Failures | `fhir-datatypes.test.js` (2) | same | pre-existing |

```text
TEST_TIMING=1 npm test
```

Lifecycle summary: no `database.startup` phase (fast profile isolation holds). Wall clock ~143 s; incidental model import during `api-generator-search-decoupling.test.js` still logs connector init (~117 s SearchParameter registry) but no `MongoMemoryServer`.

### Multi-suite MongoDB — shared lifecycle vs per-suite baseline

**Before:** single temporal round-trip file, per-suite `MongoMemoryServer` — **160,818 ms** wall, 3 cases, ~152 s logged init per run.

**After:** four temporal integration files in one process (shared server):

```text
TEST_TIMING=1 npx mocha --no-config --require test/hook.js --timeout 300000 --exit \
  test/integration/FHIR/temporal/round-trip.integration.test.js \
  test/integration/FHIR/temporal/write-persistence.integration.test.js \
  test/integration/FHIR/temporal/primitive-extension.integration.test.js \
  test/integration/FHIR/temporal/response-serialization.integration.test.js
```

| Metric | Before (1 file, per-suite server) | After (4 files, shared server) | Notes |
| --- | ---: | ---: | --- |
| Wall time | 160,818 ms | **113,110 ms** | 12 cases vs 3 |
| `database.startup` | ~152 s init (per suite) | **618 ms** (once) | `TEST_TIMING` phase |
| `database.connect` | (included in init) | **14 ms** (once) | |
| Case execution (approx.) | ~3 s | ~104 s total across 12 cases | first suite pays registry init once |
| Exit code | 0 | 0 | |

**Estimated per-suite cost avoided:** running the four temporal files separately with the old per-suite server would repeat ~100 s registry init four times (~400 s+); shared lifecycle reduces that to a single init pass.

### Coverage counts (unchanged)

| Metric | Value |
| --- | ---: |
| Fast profile files | 41 |
| Full profile files | 56 |
| Fast executable cases | 322 |
| Full executable cases (dry-run) | ~594 |
| `EXPECTED_RESOURCE_COUNT` | **146** |

## MongoDB-dependent file list

Source of truth: `MONGODB_DEPENDENT_FILES` in `test/support/test-profiles.js`.

1. `test/integration/FHIR/all-resource-crud.integration.test.js`
2. `test/integration/FHIR/temporal/primitive-extension.integration.test.js`
3. `test/integration/FHIR/temporal/response-serialization.integration.test.js`
4. `test/integration/FHIR/temporal/round-trip.integration.test.js`
5. `test/integration/FHIR/temporal/write-persistence.integration.test.js`
6. `test/integration/FHIR/Patient/patient-service.integration.test.js`
7. `test/support/fhir/crud-test-context.test.js`
8. `test/support/fhir/fhir-service.test.js`
9. `test/searchParameter/integration/patient-registry-search.integration.test.js`
10. `test/searchParameter/integration/structural-mongo.integration.test.js`
11. `test/searchParameter/migration/compatibility-plus-corrections.test.js`
12. `test/searchParameter/migration/hit-set.test.js`
13. `test/searchParameter/migration/migration.test.js`
14. `test/searchParameter/registry/registry-reload-lifecycle.test.js`
15. `test/models/mongodb/connector-lifecycle.test.js`

## Coverage verification

Re-checked on **2026-08-30** after test profile wiring (OpenSpec `optimize-test-suite-speed`, Section 4). Commands use `mocha --no-config --require test/hook.js --dry-run` unless noted.

Automated check: `node test/support/verify-full-profile-coverage.js`

### 4.1 Full profile resource, Patient, and temporal coverage

| Check | Result |
| --- | --- |
| Full profile test files (`listAllTestFiles`) | **56** |
| Fast profile test files (`resolveFastProfileFiles`) | **41** (excludes 15 MongoDB-dependent files) |
| `all-resource-crud.integration.test.js` dry-run cases | **148** executable (146 catalog create/read + 2 alignment checks) |
| `EXPECTED_RESOURCE_COUNT` | **146** |
| Specimen in catalog (`fhir.resourceList.json`) | **Yes** |
| Patient integration (`patient-service.integration.test.js`) in full profile | **Yes** — 1 executable case (dry-run) |
| Temporal integration (4 files under `test/integration/FHIR/temporal/`) | **Yes** — 12 executable cases (dry-run) |
| Temporal unit coverage (`test/models/FHIR/temporal/*.test.js`, 5 files) | **Yes** — 104 executable cases (dry-run); included via full glob |

### 4.2 Catalog, fixture provenance, and coverage alignment checks

Both alignment checks remain in `all-resource-crud.integration.test.js` and are part of the 148-case dry-run count:

| Case title (dry-run) | Purpose |
| --- | --- |
| `requires catalog and fixture provenance to stay aligned` | `compareCatalogWithFixtureProvenance` vs `loadFixtureProvenance()` |
| `defines 146 named coverage cases from the catalog` | `compareCatalogWithCoverage` vs catalog-driven `namedCoverageResourceTypes` |

Neither check uses `it.skip` / `xit`. Full profile glob (`test/**/*.test.js` via `.mocharc.full.js`) still discovers the file.

### 4.3 Specimen failure visibility (re-check)

| Check | Result |
| --- | --- |
| `it.skip` / `xit` / `xdescribe` for Specimen in `all-resource-crud.integration.test.js` | **None** |
| Specimen excluded from full profile | **No** |
| Grep-focused run (`--grep "creates and reads Specimen through"`) | **Pass** — exit 0, ~156 s wall time (2026-08-30) |

**Current state:** Specimen CRUD is **not masked** and **passes** in isolation. Full-profile stability should still be re-confirmed after shared MongoDB lifecycle work (Section 6); CI full gate remains deferred per design.

### 4.4 Duplication review (no deletions this phase)

| Area | Overlap observed | Unique contract retained | Future action |
| --- | --- | --- | --- |
| Patient create/read | `fhir-service.test.js`, `all-resource-crud`, `patient-service.integration.test.js` | Registration diagnosis (`fhir-service.test.js`); catalog fixture CRUD (`all-resource-crud`); Patient-specific service helpers (`patient-service.integration.test.js`) | **Keep all** — different surfaces |
| Patient search | `patient-registry-search.integration.test.js` | SearchParameter registry + Mongo executor integration | **Keep** — not covered elsewhere |
| Temporal | 5 unit files + 4 integration files | Unit: normalizer/serializer/contract without DB; integration: Mongo round-trip, persistence, serialization | **Keep all** — integration proves DB path |
| CRUD lifecycle | `crud-test-context.test.js` vs integration suites | Env var forcing, shared `MongoMemoryServer` reuse contract | **Keep** — lifecycle regression guard |

No tests removed or merged in Section 4. Overlapping Patient CRUD smoke paths may be revisited only if a later phase proves redundant diagnostic value.

## Artifacts

- Profile inventory module: `test/support/test-profiles.js`
- Full profile coverage verifier: `test/support/verify-full-profile-coverage.js`
- Full profile spec: `test/**/*.test.js` (`.mocharc.full.js`)
- Fast profile spec: explicit space-separated paths from `buildFastProfileSpec()` (`.mocharc.fast.js`)

## Section 6 validation (2026-08-30)

Re-validated on Windows (Node.js v24.14.1) after shared MongoDB lifecycle and profile wiring (OpenSpec `optimize-test-suite-speed`, Section 6).

### 6.1 Fast profile, diagnostics gate, temporal focused tests, shared lifecycle

| Command | Exit | Result |
| --- | ---: | --- |
| `node test/support/verify-full-profile-coverage.js` | 0 | Pass — 56 full / 41 fast files; 146 named CRUD + 2 alignment; fast isolation `ok: true` |
| `npm run test:diagnostics-gate` | 0 | 3 passing (~760 ms) |
| `mocha --no-config … round-trip.integration.test.js crud-test-context.test.js` | 0 | 8 passing (~125 s wall); shared server init ~95 s once; includes collection isolation case |
| `npm test` (fast profile, `.mocharc.fast.js`) | 1 | 320 passing, **2 failing** (pre-existing `fhir-datatypes.test.js` partial date/dateTime precision); ~142 s wall |

### 6.2 Full profile discovery and Specimen

| Check | Result |
| --- | --- |
| `mocha --config .mocharc.full.js --dry-run` | Exit 0; **595** pending/passing cases (~111 s dry-run reporter); **56** files (inventory unchanged) |
| `--grep "creates and reads Specimen"` on `all-resource-crud.integration.test.js` | Exit 0; Specimen + SpecimenDefinition passed (~107 s wall; Specimen case ~15 s after ~79 s init) |

Specimen remains **not masked** and **passes** in isolation. Full-profile CI gate still deferred per design until end-to-end full run is routinely stable.

### 6.3 Lint and OpenSpec

| Check | Result |
| --- | --- |
| `npm run lint` | Exit 1 — **23 errors** (all pre-existing: `semi` in generated FHIRDataTypesSchema + `root.js`; `no-constant-condition` in parser; `BigInt` `no-undef` in `epoch.js`). **None** in Section 2–3 artifacts (`test/support/test-profiles.js`, `mongo-memory.js`, `hook.js`, `.mocharc.*`, `package.json`). |
| `openspec validate optimize-test-suite-speed` | Exit 0 — **Change is valid** |

### 6.4 Shared lifecycle rollback decision

| Signal | Outcome |
| --- | --- |
| Multi-suite run (temporal + `crud-test-context.test.js`) | Pass; `reuses the same process-level MongoMemoryServer` and `isolates collections per resource type` both green |
| Isolation / cleanup regression | **None observed** |
| Rollback to per-suite `MongoMemoryServer` | **Not required** — keep shared lifecycle and profiles |

