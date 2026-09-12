# Migration Preview: Upgrading from v2 to v3 (/docs/v3/migration-preview)



# Migration Preview: Upgrading from Burni v2 to v3 [#migration-preview-upgrading-from-burni-v2-to-v3]

This document outlines the migration roadmap and key considerations for teams planning to upgrade from &#x2A;*Burni v2 (v2.8)** to **Burni v3**.

***

## 1. Prerequisites & Environment Setup [#1-prerequisites--environment-setup]

### Node.js Engine [#nodejs-engine]

* **v2**: Node.js >= 18
* **v3**: &#x2A;*Node.js >= 22 (LTS)**
* Verify your local environment, Docker base images, and CI runners have been updated to Node.js 22+.

### Key Dependency Changes [#key-dependency-changes]

1. **Express 5**:
   * Asynchronous route handlers automatically forward rejected Promises to error middleware.
   * Audit any custom plugins or route handlers for Express 5 compatibility.
2. **fhir-tool 5.0.2**:
   * Replaces the deprecated `fhir` package.

***

## 2. Dual-Database Configuration [#2-dual-database-configuration]

While v2 stored active resources and historical revisions in a single MongoDB database, v3 introduces separate connections for optimal scalability.

### Configuration (`.env`) [#configuration-env]

Configure your connection URIs:

```bash
# Primary database for active resources
MONGODB_URI="mongodb://localhost:27017/burni"

# Temporal database for history and provenance audits
TEMPORAL_MONGODB_URI="mongodb://localhost:27017/burni-temporal"
```

> **Note**: If `TEMPORAL_MONGODB_URI` is omitted, Burni operates in single-database fallback mode. Splitting databases is strongly recommended for production environments.

***

## 3. Temporal Data Migration Workflow [#3-temporal-data-migration-workflow]

Burni v3 provides CLI utilities to migrate existing `*_history` collections into the dedicated temporal store.

### Step A: Preflight Verification [#step-a-preflight-verification]

Verify connectivity, disk space, and collection statistics across both database targets:

```bash
npm run temporal:preflight
```

### Step B: Database Provisioning [#step-b-database-provisioning]

Initialize required collections and performance indexes in the temporal database:

```bash
npm run mongodb:provision
```

### Step C: Streaming Migration [#step-c-streaming-migration]

Execute the data migration process with batching and progress tracking:

```bash
npm run temporal:migrate
```

Verify migration consistency:

```bash
npm run mongodb:verify
```

***

## 4. Search Parameter Artifacts [#4-search-parameter-artifacts]

Rebuild search parameter artifacts if you maintain custom parameter definitions:

```bash
npm run search-parameter:build-artifacts
npm run search-parameter:verify
```

***

## 5. Test Suite Verification [#5-test-suite-verification]

Run the automated test gates to confirm migration integrity:

```bash
# Fast test profile (unit & non-mongo suites)
npm test

# Dual database migration operator and validation tests
npm run test:dual-database-migration

# All-resource CRUD integration suite (146 resources)
npm run test:all-resource-crud
```
