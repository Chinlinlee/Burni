# temporal-database-migration Specification

## Purpose

提供可恢復、可審計且不影響 legacy source database 的 temporal data migration，讓完整 FHIR 資料集能安全進入新版 canonical storage 並在 cutover 前驗證。

## Requirements

### Requirement: Migration SHALL isolate source and target databases

Migration SHALL read from a designated temporal source database and write to a distinct temporal target database. The source database SHALL remain read-only during migration, and application traffic SHALL not switch to the target until all required verification gates pass.

#### Scenario: Reject the same source and target database

- **WHEN** the source and target connection settings resolve to the same database
- **THEN** the migration SHALL stop before reading or writing temporal data

#### Scenario: Keep the source available for rollback

- **WHEN** target migration and verification complete
- **THEN** the source database SHALL remain available as a read-only rollback reference until the rollback window ends

### Requirement: Migration SHALL preserve complete resource identity and coverage

Migration SHALL process every resource collection in the production catalog, its history collection when history migration is enabled, and temporal values in nested, choice, contained, and array structures. It SHALL preserve document identity, FHIR identity, version metadata, and non-temporal content.

#### Scenario: Migrate a resource and its history

- **WHEN** a resource document and corresponding history documents exist in the source database
- **THEN** the target database SHALL contain transformed documents with the same document identity, FHIR identity, version metadata, and non-temporal content

#### Scenario: Migrate a nested temporal array

- **WHEN** a temporal value occurs inside a nested choice, contained resource, or array element
- **THEN** the target document SHALL contain the canonical temporal value at the corresponding structural path without correlating it to another array element

### Requirement: Migration SHALL be resumable and idempotent

Migration SHALL process data in bounded batches, persist durable progress for each completed source batch, and support retry after an interruption. Retrying a completed batch SHALL not duplicate documents or wrap an existing canonical temporal object again.

#### Scenario: Resume after a failed batch

- **WHEN** a target write fails after earlier source batches have been checkpointed
- **THEN** a retry SHALL resume from the durable checkpoint or safely reprocess the earlier batch without changing its verified result

#### Scenario: Re-run canonical data

- **WHEN** a source value is already a valid canonical temporal object
- **THEN** migration SHALL preserve it and SHALL NOT create another temporal wrapper

### Requirement: Migration SHALL audit lossy BSON Date conversion

Migration SHALL apply a deterministic policy to legacy BSON Date values. A `date` BSON Date SHALL use its UTC calendar date with `day` precision; `dateTime` and `instant` BSON Dates SHALL use a UTC canonical representation. Each conversion that cannot reproduce the original FHIR lexical representation SHALL be recorded in an audit artifact with source identity, FHIR path, temporal type, applied policy, original value, and generated value.

#### Scenario: Convert a legacy BSON Date date

- **WHEN** a legacy `date` field contains a valid BSON Date
- **THEN** migration SHALL create a canonical `date` object using the UTC calendar date and SHALL record the conversion as lossy

#### Scenario: Convert a legacy BSON Date instant

- **WHEN** a legacy `instant` field contains a valid BSON Date
- **THEN** migration SHALL create a canonical UTC instant representation and SHALL record any unrecoverable lexical details in the audit artifact

#### Scenario: Report an invalid temporal value

- **WHEN** a temporal value is invalid or no conversion policy applies
- **THEN** migration SHALL fail-fast, SHALL identify the source document and FHIR path, and SHALL NOT mark the target migration as complete

### Requirement: Migration SHALL verify the target before cutover

The migration process SHALL provide read-only evidence that the target is complete before application cutover. Verification SHALL cover source/target counts and identities, transformed document content, temporal preflight, required indexes, and representative temporal search hit-sets.

#### Scenario: Reject an incomplete target

- **WHEN** a source/target count, identity, content, or temporal verification differs
- **THEN** cutover SHALL be blocked and the target SHALL remain outside application traffic

#### Scenario: Allow a verified cutover

- **WHEN** all migration batches succeed, all lossy conversions have audit records, and every required verification gate passes
- **THEN** the target SHALL be eligible for application connection cutover

### Requirement: Migration operations SHALL protect database credentials and target identity

The operator interface SHALL require explicit source and target connection settings and database identity confirmation before a write operation. Reports and logs SHALL redact credentials and SHALL identify source and target databases without exposing authenticated connection strings.

#### Scenario: Require target confirmation

- **WHEN** an operator starts a write migration without confirming the resolved target database identity
- **THEN** the migration SHALL stop before writing to the target

#### Scenario: Redact connection credentials

- **WHEN** migration progress or evidence is emitted
- **THEN** credentials, passwords, and authenticated connection strings SHALL NOT appear in logs or reports
