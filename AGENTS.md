# Agent Notes

## Running a subset of Mocha tests

`.mocharc.js` sets `spec: "test/**/*.test.js"`. Mocha merges that glob with any file or `--spec` passed on the CLI, so a targeted run still executes the full suite.

When running one file or a narrow subset, pass `--no-config` and supply the options from `.mocharc.js` explicitly:

```bash
mocha --no-config --require test/hook.js --timeout 300000 --exit path/to/test.test.js
```

For npm scripts that run a single gate or focused test file, use the same pattern:

```json
"test:diagnostics-gate": "mocha --no-config --require test/hook.js --timeout 300000 --exit test/searchParameter/migration/diagnostics-ci-gate.test.js",
"test:all-resource-crud": "mocha --no-config --require test/hook.js --timeout 600000 --exit test/integration/FHIR/all-resource-crud.integration.test.js"
```

`npm run test:all-resource-crud` runs the catalog-driven create/read suite. It must execute one named case per FHIR resource catalog entry (currently 146) plus the catalog/provenance alignment checks.

Use `npm test` (or `mocha` with no extra args) when the intent is to run the full test suite.
