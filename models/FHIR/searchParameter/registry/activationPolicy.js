const { createDiagnostic } = require("./diagnostics");

const UNSUPPORTED_TYPES = new Set(["special"]);

/**
 * @param {import('./types').SearchParameterDefinition} definition
 * @param {{ compilable: boolean, reason?: string }} compileState
 * @returns {import('./types').SearchParameterDefinition}
 */
function applyActivationOverlay(definition, compileState) {
    const next = {
        ...definition,
        diagnostics: [...definition.diagnostics]
    };
    const rawStatus = definition.rawStatus;
    const type = definition.resource.type;

    if (UNSUPPORTED_TYPES.has(type || "")) {
        next.effectiveStatus = "disabled";
        next.disableReason = `Unsupported SearchParameter type: ${type}`;
        next.diagnostics.push(
            createDiagnostic({
                code: "unsupported-type",
                category: "activation",
                message: next.disableReason,
                canonicalKey: definition.canonicalKey,
                source: definition.source,
                rawStatus,
                effectiveStatus: "disabled"
            })
        );
        return next;
    }

    if (definition.source === "builtin-bundle") {
        if (rawStatus === "active" || rawStatus === "draft") {
            if (compileState.compilable) {
                next.effectiveStatus = "active";
            } else {
                next.effectiveStatus = "disabled";
                next.disableReason = compileState.reason || "Expression is not compilable";
                next.diagnostics.push(
                    createDiagnostic({
                        code: "compile-failed",
                        category: "activation",
                        message: next.disableReason,
                        canonicalKey: definition.canonicalKey,
                        source: definition.source,
                        rawStatus,
                        effectiveStatus: "disabled",
                        expression: definition.resource.expression
                    })
                );
            }
        } else {
            next.effectiveStatus = "disabled";
            next.disableReason = `Builtin SearchParameter status ${rawStatus} is not activatable`;
            next.diagnostics.push(
                createDiagnostic({
                    code: "status-not-activatable",
                    category: "activation",
                    message: next.disableReason,
                    canonicalKey: definition.canonicalKey,
                    source: definition.source,
                    rawStatus,
                    effectiveStatus: "disabled"
                })
            );
        }
        return next;
    }

    if (rawStatus === "active" && compileState.compilable) {
        next.effectiveStatus = "active";
        return next;
    }

    next.effectiveStatus = "disabled";
    if (rawStatus !== "active") {
        next.disableReason = `Database SearchParameter status ${rawStatus} is not active`;
    } else {
        next.disableReason = compileState.reason || "Expression is not compilable";
    }
    next.diagnostics.push(
        createDiagnostic({
            code: rawStatus !== "active" ? "status-not-activatable" : "compile-failed",
            category: "activation",
            message: next.disableReason,
            canonicalKey: definition.canonicalKey,
            source: definition.source,
            rawStatus,
            effectiveStatus: "disabled",
            expression: definition.resource.expression
        })
    );
    return next;
}

module.exports = {
    applyActivationOverlay
};
