const fs = require("fs");
const path = require("path");
const { loadBuiltinDefinitions } = require("../registry/sourceAdapter");
const productionResources = require("../../fhir.resourceList.json");

const INVENTORY_DIFF_ARTIFACT_PATH = path.join(__dirname, "artifacts/inventory-diff-report.json");

/**
 * @typedef {Object} InventoryEntry
 * @property {string} resource
 * @property {string} [url]
 * @property {{ name: string, type: string, expression?: string }[]} searchParameters
 */

/**
 * @returns {Object}
 */
function loadCommittedInventoryDiffReport() {
    if (!fs.existsSync(INVENTORY_DIFF_ARTIFACT_PATH)) {
        throw new Error(
            `Committed inventory diff report not found: ${INVENTORY_DIFF_ARTIFACT_PATH}`
        );
    }
    return JSON.parse(fs.readFileSync(INVENTORY_DIFF_ARTIFACT_PATH, "utf8"));
}

/**
 * @param {string} inventoryPath
 * @returns {InventoryEntry[]}
 */
function loadMigrationInventory(inventoryPath) {
    if (!fs.existsSync(inventoryPath)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
}

/**
 * @param {import('../registry/types').SearchParameterDefinition[]} definitions
 * @returns {Map<string, Map<string, { expression: string, type: string, canonicalKey: string }>>}
 */
function buildBundleLookupIndex(definitions) {
    /** @type {Map<string, Map<string, { expression: string, type: string, canonicalKey: string }>>} */
    const index = new Map();

    for (const definition of definitions) {
        const code = definition.resource.code || "";
        const expression = definition.resource.expression || "";
        const type = definition.resource.type || "";
        for (const lookupKey of definition.lookupKeys) {
            const [resourceType] = lookupKey.split("::");
            if (!index.has(resourceType)) {
                index.set(resourceType, new Map());
            }
            index.get(resourceType).set(code, {
                expression,
                type,
                canonicalKey: definition.canonicalKey
            });
        }
    }

    return index;
}

/**
 * 僅在明確提供 legacy inventory 路徑時重新產生差異報告；日常驗證使用 loadCommittedInventoryDiffReport()。
 *
 * @param {string} inventoryPath
 * @returns {Object}
 */
function buildInventoryDiffReport(inventoryPath) {
    if (!inventoryPath) {
        throw new Error(
            "inventoryPath is required; use loadCommittedInventoryDiffReport() for the archived migration report"
        );
    }

    const inventory = loadMigrationInventory(inventoryPath);
    const { definitions } = loadBuiltinDefinitions();
    const bundleIndex = buildBundleLookupIndex(definitions);

    /** @type {string[]} */
    const inventoryOnlyResources = [];
    /** @type {string[]} */
    const catalogOnlyResources = [];
    /** @type {Object[]} */
    const codeMismatches = [];
    /** @type {Object[]} */
    const expressionMismatches = [];
    /** @type {Object[]} */
    const typeMismatches = [];

    const inventoryResourceSet = new Set(inventory.map((entry) => entry.resource));
    const productionSet = new Set(productionResources);

    for (const resource of inventoryResourceSet) {
        if (!productionSet.has(resource)) {
            inventoryOnlyResources.push(resource);
        }
    }

    for (const resource of productionSet) {
        if (!inventoryResourceSet.has(resource)) {
            catalogOnlyResources.push(resource);
        }
    }

    for (const entry of inventory) {
        const bundleLookups = bundleIndex.get(entry.resource) || new Map();
        const inventoryCodes = new Set(
            (entry.searchParameters || []).map((parameter) => parameter.name)
        );

        for (const code of inventoryCodes) {
            if (!bundleLookups.has(code)) {
                codeMismatches.push({
                    resource: entry.resource,
                    code,
                    issue: "inventory-only"
                });
            }
        }

        for (const parameter of entry.searchParameters || []) {
            const bundleEntry = bundleLookups.get(parameter.name);
            if (!bundleEntry) {
                continue;
            }
            const inventoryExpression = (parameter.expression || "").trim();
            const bundleExpression = (bundleEntry.expression || "").trim();
            if (inventoryExpression && bundleExpression && inventoryExpression !== bundleExpression) {
                expressionMismatches.push({
                    resource: entry.resource,
                    code: parameter.name,
                    inventoryExpression,
                    bundleExpression,
                    canonicalKey: bundleEntry.canonicalKey
                });
            }
            if (parameter.type && bundleEntry.type && parameter.type !== bundleEntry.type) {
                typeMismatches.push({
                    resource: entry.resource,
                    code: parameter.name,
                    inventoryType: parameter.type,
                    bundleType: bundleEntry.type
                });
            }
        }

        for (const [code] of bundleLookups) {
            if (!inventoryCodes.has(code)) {
                codeMismatches.push({
                    resource: entry.resource,
                    code,
                    issue: "bundle-only"
                });
            }
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        inventoryPath,
        inventoryLoadedByRuntime: false,
        inventoryResourceCount: inventory.length,
        productionResourceCount: productionResources.length,
        bundleLookupCount: [...bundleIndex.values()].reduce(
            (total, lookups) => total + lookups.size,
            0
        ),
        inventoryOnlyResources,
        catalogOnlyResources,
        codeMismatches,
        expressionMismatches,
        typeMismatches,
        summary: {
            expressionMismatchCount: expressionMismatches.length,
            typeMismatchCount: typeMismatches.length,
            codeMismatchCount: codeMismatches.length,
            inventoryOnlyResourceCount: inventoryOnlyResources.length,
            catalogOnlyResourceCount: catalogOnlyResources.length
        }
    };
}

module.exports = {
    INVENTORY_DIFF_ARTIFACT_PATH,
    loadCommittedInventoryDiffReport,
    loadMigrationInventory,
    buildBundleLookupIndex,
    buildInventoryDiffReport
};
