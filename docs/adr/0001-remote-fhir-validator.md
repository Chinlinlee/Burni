---
status: accepted
---

# Remote FHIR Validator over HTTP

Burni used to embed `node-java-fhir-validator` in-process, after an earlier C# HTTP validator. A JVM inside the Node process ties Burni to JDK install, local IG files, and validator startup. Profile validation now goes to a remote [Inferno FHIR validator wrapper](https://github.com/Chinlinlee/inferno-fhir-validator-wrapper): `POST` the resource JSON to `VALIDATOR_URL` and use the OperationOutcome.

IGs are loaded on the Validator, not in Burni. When the Validator is enabled, create, update, Bundle writes, and `$validate` wait on that HTTP call. When it is disabled, Burni still does structure validation with mongoose. `$validate` is not a feature flag; it always exists.

## Considered Options

- Keep in-process Java. Rejected: Burni still needs a JDK, `utils/validator/igs`, and a JVM in the Node process.
- Treat `VALIDATOR_URL` as a FHIR base and call `{base}/{type}/$validate`. Rejected: Inferno's contract is `POST /validate`, and the env var is a single endpoint.
- Fail open on timeout or connection error. Rejected: an enabled Validator that cannot be reached would store unvalidated resources.

## Consequences

- `ENABLE_CSHARP_VALIDATOR`, `VALIDATION_API_URL`, and `VALIDATION_FILES_ROOT_PATH` are retired.
- Burni does not load IGs, does not retry, and does not ping the Validator at startup. When the Validator is enabled, a missing or non-absolute `http`/`https` `VALIDATOR_URL`, or a `VALIDATOR_TIMEOUT_MS` that is not a positive integer, fails boot.
- Validation failure is 422 with the Validator's OperationOutcome (error or fatal issues). Validator unavailable is 503 (unreachable or timeout) or 502 (response is not an OperationOutcome), with an OperationOutcome Burni creates. The write is not stored.
