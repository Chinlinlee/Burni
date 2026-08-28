## Purpose

讓 Burni 在 create、update、Bundle 寫入與 `$validate` 時，以 HTTP 呼叫遠端 Validator 做 profile validation，並把 FHIR OperationOutcome 回給用戶。Burni 不嵌入驗證引擎，也不載入 IG。

## ADDED Requirements

### Requirement: ENABLE_VALIDATOR does not hide $validate

The system SHALL expose `$validate` whether or not the Validator is enabled. When `ENABLE_VALIDATOR` is not the string `true`, create, update, Bundle writes, and `$validate` SHALL use mongoose structure validation (writes also SHALL run contained checks). When `ENABLE_VALIDATOR` is `true`, those same operations SHALL wait on the remote Validator before succeeding.

#### Scenario: Validator disabled still serves $validate

- **WHEN** `ENABLE_VALIDATOR` is not `true` and a client calls `$validate` with a resource that matches the mongoose base schema
- **THEN** the system responds 200 with an OperationOutcome and does not call `VALIDATOR_URL`

#### Scenario: Validator disabled rejects invalid structure

- **WHEN** `ENABLE_VALIDATOR` is not `true` and a client creates or `$validate`s a resource that fails mongoose structure validation
- **THEN** the system responds 422 with an OperationOutcome and does not store the resource

#### Scenario: Validator enabled waits on remote validation before write

- **WHEN** `ENABLE_VALIDATOR` is `true` and a client creates or updates a resource
- **THEN** the system MUST NOT store the resource until the Validator returns an OperationOutcome with no error or fatal issue

### Requirement: Boot-time Validator configuration

When `ENABLE_VALIDATOR` is `true`, the system SHALL require `VALIDATOR_URL` to be an absolute `http` or `https` URL. The system MUST NOT append `/validate` or any other path to `VALIDATOR_URL`. When `VALIDATOR_TIMEOUT_MS` is unset, the system SHALL use `30000`. When `VALIDATOR_TIMEOUT_MS` is set, it MUST be a positive integer; `0` or a non-integer MUST fail boot. When `ENABLE_VALIDATOR` is not `true`, the system SHALL ignore `VALIDATOR_URL` and `VALIDATOR_TIMEOUT_MS`. The system MUST NOT ping the Validator at startup.

#### Scenario: Missing VALIDATOR_URL fails boot

- **WHEN** `ENABLE_VALIDATOR` is `true` and `VALIDATOR_URL` is missing or empty
- **THEN** the process fails to start

#### Scenario: Non-absolute VALIDATOR_URL fails boot

- **WHEN** `ENABLE_VALIDATOR` is `true` and `VALIDATOR_URL` is not an absolute `http` or `https` URL
- **THEN** the process fails to start

#### Scenario: Invalid VALIDATOR_TIMEOUT_MS fails boot

- **WHEN** `ENABLE_VALIDATOR` is `true` and `VALIDATOR_TIMEOUT_MS` is `0`, empty, or not a positive integer
- **THEN** the process fails to start

#### Scenario: Disabled Validator ignores URL and timeout

- **WHEN** `ENABLE_VALIDATOR` is not `true` and `VALIDATOR_URL` is missing
- **THEN** the process starts and does not call a Validator

#### Scenario: Boot does not ping the Validator

- **WHEN** `ENABLE_VALIDATOR` is `true` and `VALIDATOR_URL` is a valid absolute `http` URL
- **THEN** the process starts without sending an HTTP request to the Validator

### Requirement: POST the resource JSON to VALIDATOR_URL

When the Validator is enabled, the system SHALL `POST` the resource as JSON to `VALIDATOR_URL`. If `meta.profile` is present, the system SHALL add a `profile` query parameter whose value is those profile URLs joined by commas. The system MUST NOT read `$validate?profile=`. The system MUST NOT unwrap a Parameters body. The system MUST NOT retry the HTTP call.

#### Scenario: POST JSON to the configured URL

- **WHEN** the Validator is enabled and a resource without `meta.profile` is validated
- **THEN** the system POSTs that resource JSON to `VALIDATOR_URL` with no `profile` query parameter

#### Scenario: meta.profile becomes the profile query

- **WHEN** the resource has `meta.profile` with one or more URLs
- **THEN** the POST URL includes `profile` equal to those URLs joined by commas

#### Scenario: $validate profile query is ignored

- **WHEN** a client calls `$validate?profile=` with a profile URL and the resource has no `meta.profile`
- **THEN** the system POSTs to `VALIDATOR_URL` without a `profile` query parameter

#### Scenario: Parameters body is not unwrapped

- **WHEN** the request body is a Parameters resource
- **THEN** the system POSTs that Parameters JSON as-is and does not extract an inner resource

### Requirement: Echo the Validator OperationOutcome

When the Validator HTTP response body is a FHIR OperationOutcome, the system SHALL return that OperationOutcome to the client without rewriting its issues. If any issue has severity `error` or `fatal`, the system SHALL respond 422. If every issue is information or warning (or there is no error or fatal issue), the system SHALL respond 200. The system SHALL apply this mapping from the OperationOutcome issues, not from the Validator HTTP status.

#### Scenario: Error or fatal issue is 422

- **WHEN** the Validator returns an OperationOutcome that contains an issue with severity `error` or `fatal`
- **THEN** the client receives HTTP 422 and that same OperationOutcome

#### Scenario: Information or warning only is 200

- **WHEN** the Validator returns an OperationOutcome whose issues are only information or warning
- **THEN** the client receives HTTP 200 and that same OperationOutcome

### Requirement: Validator unavailable fails closed

When the Validator is unreachable or the request exceeds `VALIDATOR_TIMEOUT_MS`, the system SHALL respond 503 with an OperationOutcome created by Burni. When the HTTP response body is not an OperationOutcome, the system SHALL respond 502 with an OperationOutcome created by Burni. On create, update, and Bundle writes, the system MUST NOT store the resource in either case. These responses are not validation failures.

#### Scenario: Timeout is 503 and write is not stored

- **WHEN** the Validator does not respond within `VALIDATOR_TIMEOUT_MS` during create or update
- **THEN** the client receives HTTP 503 with a Burni-created OperationOutcome and the resource is not stored

#### Scenario: Unreachable Validator is 503

- **WHEN** the Validator TCP or HTTP connection fails
- **THEN** the client receives HTTP 503 with a Burni-created OperationOutcome and a write is not stored

#### Scenario: Non-OperationOutcome body is 502

- **WHEN** the Validator returns a body whose `resourceType` is not `OperationOutcome`
- **THEN** the client receives HTTP 502 with a Burni-created OperationOutcome and a write is not stored

#### Scenario: $validate uses the same unavailable mapping

- **WHEN** `$validate` hits timeout, connection failure, or a non-OperationOutcome body
- **THEN** the client receives 503 or 502 as above, with an OperationOutcome, and no resource is stored
