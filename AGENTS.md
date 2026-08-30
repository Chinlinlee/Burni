# Agent Notes

## Test profiles

- `npm test` runs the **fast profile** (`.mocharc.fast.js`): non-MongoDB suites only.
- `npm run test:full` runs the **full profile** (`.mocharc.full.js`): all `test/**/*.test.js` suites.
- Root `.mocharc.js` still discovers the full suite; prefer the npm scripts above for daily vs release validation.

Enable lifecycle timing with `TEST_TIMING=1`. Verify full-profile coverage with `node test/support/verify-full-profile-coverage.js`.

## Running a subset of Mocha tests

Mocha merges a config `spec` glob with any file or `--spec` passed on the CLI, so a targeted run can still execute the full suite unless config is disabled.

When running one file or a narrow subset, pass `--no-config` and supply hook, timeout, and exit explicitly:

```bash
mocha --no-config --require test/hook.js --timeout 300000 --exit path/to/test.test.js
```

For npm scripts that run a single gate or focused test file, use the same pattern:

```json
"test:diagnostics-gate": "mocha --no-config --require test/hook.js --timeout 300000 --exit test/searchParameter/migration/diagnostics-ci-gate.test.js",
"test:all-resource-crud": "mocha --no-config --require test/hook.js --timeout 600000 --exit test/integration/FHIR/all-resource-crud.integration.test.js"
```

`npm run test:all-resource-crud` runs the catalog-driven create/read suite. It must execute one named case per FHIR resource catalog entry (currently 146) plus the catalog/provenance alignment checks.

Use `npm run test:full` when the intent is to run the full test suite.
