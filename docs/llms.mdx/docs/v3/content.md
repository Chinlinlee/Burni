# Burni v3 Overview (Preview) (/docs/v3)



# Burni v3 (Preview) New Features Overview [#burni-v3-preview-new-features-overview]

**Burni v3** represents a major leap forward for the Burni FHIR Server. Building upon the solid FHIR R4 compliance and production stability of v2, v3 re-engineers the runtime foundation and database layer to meet modern cloud-native standards, large-scale clinical data persistence, and ultra-fast query performance.

***

## 🌟 Key Highlights [#-key-highlights]

### 1. Core Stack Modernization [#1-core-stack-modernization]

* **Node.js >= 22 (LTS)**: Leverages latest ECMAScript features and optimized V8 performance.
* **Express 5 (5.2.1)**: Upgrades to Express 5 for native Promise rejection handling, hardened query parser security, and lower HTTP routing overhead.
* **Mongoose 8 (8.24+)**: Latest ODM generation with enhanced TypeScript safety and robust connection pool lifecycle controls.
* **fhir-tool 5.0.2**: Replaces legacy dependencies with a lightweight, optimized R4 validation and schema utility.

### 2. Dual-Database & Temporal Architecture [#2-dual-database--temporal-architecture]

Clinical FHIR workloads generate continuous version updates (`_history`) and audit provenances that can cause severe database bloat when mixed with active resources.

v3 introduces a clean **Dual-Database topology**:

* **Primary Database**: Holds only currently active resources, keeping index working sets small and clinical reads fast.
* **Temporal Database**: Houses version histories (`*_history`), vread operations, and HTTP request audit provenances.
* **Streaming Migration**: Includes `npm run temporal:preflight` and `npm run temporal:migrate` for zero-downtime progressive data migration.

### 3. Enhanced FHIR System Parameters [#3-enhanced-fhir-system-parameters]

v3 brings full support for standard FHIR system-level search parameters:

* **`_tag`**: Filter resources by coding system and code tags.
* **`_security`**: Filter by security classification labels.
* **`_profile`**: Filter by StructureDefinition canonical profiles.
* **Full Date Precision & Timezone Offsets**: Compliant date range parsing across varying granularities (year, month, day, second, millisecond) and UTC offsets.

### 4. Enterprise Quality & Tooling [#4-enterprise-quality--tooling]

* **All-Resource CRUD Gate (`npm run test:all-resource-crud`)**: Automated coverage across all 146 FHIR R4 catalog resources.
* **Diagnostics CI Gate**: Automated verification for search parameter mappings and query builders.
* **Mocha 12 + Chai 6 + ESLint 10 Flat Config**: Clean, modern linting and testing toolchain.

***

## 📚 Preview Sections [#-preview-sections]

* **[Migration Preview: Upgrading from v2 to v3](./v3/migration-preview)**: Prerequisites, configuration updates, and migration CLI execution.
* **[Temporal & Dual Database Architecture](./v3/temporal-architecture)**: How active and historical collections coordinate seamlessly.
* **[FHIR System Search Parameters](./v3/system-search-parameters)**: Detailed syntax and examples for `_tag`, `_profile`, `_security`, and date filtering.
