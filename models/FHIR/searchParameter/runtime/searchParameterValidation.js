const { getEffectiveDefinition, resolveLookupStatus } = require("../registry/snapshot");
const {
    buildRelationPlan,
    buildRelationAggregation
} = require("../executor/relationPlan");
const { validateAndBuildFilter } = require("../executor/queryValueParser");
const { parseSearchParameterName } = require("./parameterName");
const {
    RelationLimitSearchParameterError,
    isRelationLimitClass
} = require("./relationLimitErrors");
const {
    UnknownSearchParameterError,
    InvalidSearchParameterValueError
} = require("./searchParameterErrors");

/**
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {string} resourceType
 * @param {string} parameterName
 * @param {string | string[]} rawValue
 */
function validateRegistrySearchParameter(snapshot, resourceType, parameterName, rawValue) {
    const parsed = parseSearchParameterName(parameterName);
    const lookupStatus = resolveLookupStatus(snapshot, resourceType, parsed.code);
    if (lookupStatus === "disabled" || lookupStatus === "unknown") {
        throw new UnknownSearchParameterError(parameterName, rawValue);
    }

    const definition = getEffectiveDefinition(snapshot, resourceType, parsed.code);
    if (!definition?.compiledPlan) {
        throw new UnknownSearchParameterError(parameterName, rawValue);
    }

    const plan = definition.compiledPlan;

    if (parsed.chain) {
        const relation = buildRelationPlan(plan, parsed, snapshot);
        if (!relation.valid) {
            if (isRelationLimitClass(relation.class)) {
                throw new RelationLimitSearchParameterError(parameterName, relation.class);
            }
            throw new UnknownSearchParameterError(parameterName, rawValue);
        }
        try {
            buildRelationAggregation(relation.relationPlan, rawValue);
        } catch (error) {
            throw new InvalidSearchParameterValueError(
                error instanceof Error ? error.message : String(error)
            );
        }
        return;
    }

    const result = validateAndBuildFilter(plan, rawValue, parameterName);
    if (!result.valid) {
        throw new InvalidSearchParameterValueError(result.reason || "Invalid search query");
    }
}

module.exports = {
    UnknownSearchParameterError,
    InvalidSearchParameterValueError,
    validateRegistrySearchParameter
};
