/**
 * @typedef {{ path: string, field: string, value: unknown, reason: string }[]} Augmentation
 */

/** @type {Record<string, (resource: Object) => { resource: Object, augmentations: Augmentation }>} */
const KNOWN_DERIVED_BUILDERS = {
    Patient(resource) {
        const derived = JSON.parse(JSON.stringify(resource));
        const augmentations = [];

        delete derived.id;

        if (!derived.generalPractitioner) {
            derived.generalPractitioner = [{ reference: "Practitioner/gp-example" }];
            augmentations.push({
                path: "generalPractitioner",
                field: "generalPractitioner",
                value: derived.generalPractitioner,
                reason: "general-practitioner lookup requires a reference"
            });
        }

        if (!derived.link) {
            derived.link = [{ other: { reference: "Patient/link-target" }, type: "seealso" }];
            augmentations.push({
                path: "link",
                field: "link",
                value: derived.link,
                reason: "link lookup requires a Patient reference"
            });
        }

        const hasPhone = (derived.telecom || []).some((entry) => entry.system === "phone");
        const hasEmail = (derived.telecom || []).some((entry) => entry.system === "email");
        if (!hasPhone || !hasEmail) {
            derived.telecom = [
                { system: "phone", value: "+31612345678", use: "mobile" },
                { system: "phone", value: "+31201234567", use: "home" },
                { system: "email", value: "roel.bor@example.org", use: "home" }
            ];
            augmentations.push({
                path: "telecom",
                field: "telecom",
                value: derived.telecom,
                reason: "phone and email lookups require ContactPoint values"
            });
        }

        return { resource: derived, augmentations };
    }
};

/**
 * @param {Object} document
 * @param {string} mongoPath
 * @returns {boolean}
 */
function hasValueAtPath(document, mongoPath) {
    const segments = mongoPath.split(".");
    let current = [document];

    for (const segment of segments) {
        const next = [];
        for (const item of current) {
            if (item == null) {
                continue;
            }
            if (Array.isArray(item)) {
                for (const element of item) {
                    const value = element?.[segment];
                    if (value !== undefined && value !== null && value !== "") {
                        next.push(value);
                    }
                }
            } else {
                const value = item[segment];
                if (value !== undefined && value !== null && value !== "") {
                    next.push(value);
                }
            }
        }
        if (next.length === 0) {
            return false;
        }
        current = next;
    }

    return current.length > 0;
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {boolean}
 */
function fixtureSupportsPlan(document, plan) {
    if (!plan.extractionPaths || plan.extractionPaths.length === 0) {
        return false;
    }
    return plan.extractionPaths.every((entry) => hasValueAtPath(document, entry.path));
}

/**
 * @param {string} resourceType
 * @param {Object} officialResource
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan[]} compiledPlans
 * @returns {{ resource: Object, augmentations: Augmentation, needsDerived: boolean }}
 */
function buildDerivedFixture(resourceType, officialResource, compiledPlans) {
    if (KNOWN_DERIVED_BUILDERS[resourceType]) {
        const built = KNOWN_DERIVED_BUILDERS[resourceType](officialResource);
        return {
            resource: built.resource,
            augmentations: built.augmentations,
            needsDerived: built.augmentations.length > 0
        };
    }

    const unsupportedPlans = compiledPlans.filter((plan) => !fixtureSupportsPlan(officialResource, plan));
    return {
        resource: JSON.parse(JSON.stringify(officialResource)),
        augmentations: unsupportedPlans.map((plan) => ({
            path: plan.extractionPaths.map((entry) => entry.path).join("|"),
            field: plan.code,
            value: null,
            reason: `Compiled lookup ${plan.code} has no resolvable extraction path in official example`
        })),
        needsDerived: unsupportedPlans.length > 0
    };
}

/** @type {Record<string, Object>} */
const SYNTHETIC_FIXTURES = {
    SubstanceNucleicAcid: {
        resourceType: "SubstanceNucleicAcid",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    SubstancePolymer: {
        resourceType: "SubstancePolymer",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    SubstanceProtein: {
        resourceType: "SubstanceProtein",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    SubstanceReferenceInformation: {
        resourceType: "SubstanceReferenceInformation",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    SubstanceSourceMaterial: {
        resourceType: "SubstanceSourceMaterial",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    Binary: {
        resourceType: "Binary",
        contentType: "text/plain",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    BiologicallyDerivedProduct: {
        resourceType: "BiologicallyDerivedProduct",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    CatalogEntry: {
        resourceType: "CatalogEntry",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    MedicinalProductIngredient: {
        resourceType: "MedicinalProductIngredient",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    MedicinalProductManufactured: {
        resourceType: "MedicinalProductManufactured",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    ObservationDefinition: {
        resourceType: "ObservationDefinition",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    OperationOutcome: {
        resourceType: "OperationOutcome",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    },
    Parameters: {
        resourceType: "Parameters",
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    }
};

/**
 * @param {string} resourceType
 * @returns {Object}
 */
function buildSyntheticFixture(resourceType) {
    if (SYNTHETIC_FIXTURES[resourceType]) {
        return JSON.parse(JSON.stringify(SYNTHETIC_FIXTURES[resourceType]));
    }
    return {
        resourceType,
        meta: { tag: [{ system: "urn:burni:fixture-source", code: "synthetic" }] }
    };
}

module.exports = {
    KNOWN_DERIVED_BUILDERS,
    hasValueAtPath,
    fixtureSupportsPlan,
    buildDerivedFixture,
    buildSyntheticFixture,
    SYNTHETIC_FIXTURES
};
