#!/usr/bin/env node
"use strict";

const {
    EXPECTED_RESOURCE_COUNT,
    MONGODB_DEPENDENT_FILES,
    listAllTestFiles,
    resolveFastProfileFiles,
    validateFastProfileIsolation,
    countMochaCasesFromDryRun
} = require("./test-profiles");

const ALL_RESOURCE_CRUD_FILE = "test/integration/FHIR/all-resource-crud.integration.test.js";
const PATIENT_INTEGRATION_FILE = "test/integration/FHIR/Patient/patient-service.integration.test.js";
const TEMPORAL_INTEGRATION_FILES = [
    "test/integration/FHIR/temporal/primitive-extension.integration.test.js",
    "test/integration/FHIR/temporal/response-serialization.integration.test.js",
    "test/integration/FHIR/temporal/round-trip.integration.test.js",
    "test/integration/FHIR/temporal/write-persistence.integration.test.js"
];

/**
 * @param {boolean} condition
 * @param {string} message
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function verifyFullProfileCoverage() {
    const failures = [];
    const allFiles = listAllTestFiles();
    const fastFiles = resolveFastProfileFiles();
    const isolation = validateFastProfileIsolation(fastFiles);

    if (!isolation.ok) {
        failures.push(
            `Fast profile includes MongoDB-dependent files: ${isolation.violations.join(", ")}`
        );
    }

    for (const mongoFile of MONGODB_DEPENDENT_FILES) {
        if (fastFiles.includes(mongoFile)) {
            failures.push(`Fast profile must exclude MongoDB-dependent file: ${mongoFile}`);
        }
    }

    const requiredFullFiles = [ALL_RESOURCE_CRUD_FILE, PATIENT_INTEGRATION_FILE, ...TEMPORAL_INTEGRATION_FILES];
    for (const requiredFile of requiredFullFiles) {
        if (!allFiles.includes(requiredFile)) {
            failures.push(`Full profile missing required file: ${requiredFile}`);
        }
    }

    const crudDryRun = countMochaCasesFromDryRun([ALL_RESOURCE_CRUD_FILE]);
    const namedResourceCases = crudDryRun.executable - 2;

    if (namedResourceCases < EXPECTED_RESOURCE_COUNT) {
        failures.push(
            `all-resource-crud has ${namedResourceCases} catalog create/read cases; expected at least ${EXPECTED_RESOURCE_COUNT}`
        );
    }

    const temporalDryRun = countMochaCasesFromDryRun(TEMPORAL_INTEGRATION_FILES);
    if (temporalDryRun.files !== TEMPORAL_INTEGRATION_FILES.length || temporalDryRun.executable === 0) {
        failures.push("Temporal integration coverage is missing or empty in full profile");
    }

    const patientDryRun = countMochaCasesFromDryRun([PATIENT_INTEGRATION_FILE]);
    if (patientDryRun.executable === 0) {
        failures.push("Patient focused integration has no executable cases in full profile");
    }

    if (failures.length > 0) {
        throw new Error(failures.join("\n"));
    }

    return {
        fullProfileFiles: allFiles.length,
        fastProfileFiles: fastFiles.length,
        crudExecutableCases: crudDryRun.executable,
        namedResourceCases,
        alignmentChecks: 2,
        temporalIntegrationCases: temporalDryRun.executable,
        patientIntegrationCases: patientDryRun.executable,
        fastProfileIsolation: isolation
    };
}

if (require.main === module) {
    try {
        const summary = verifyFullProfileCoverage();
        console.log("Full profile coverage verification passed.");
        console.log(JSON.stringify(summary, null, 2));
    } catch (error) {
        console.error("Full profile coverage verification failed.");
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

module.exports = {
    verifyFullProfileCoverage,
    ALL_RESOURCE_CRUD_FILE,
    PATIENT_INTEGRATION_FILE,
    TEMPORAL_INTEGRATION_FILES
};
