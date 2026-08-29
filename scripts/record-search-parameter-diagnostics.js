require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");

const outputPath = path.join(__dirname, "../temp/search-parameter-compiler-diagnostics.json");

const { definitions, diagnostics: loadDiagnostics } = loadBuiltinDefinitions();
/** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
const compiledDefinitions = [];
/** @type {Object[]} */
const compilerDiagnostics = [...loadDiagnostics];

for (const definition of definitions) {
    const compileResult = compileDefinition(definition);
    compilerDiagnostics.push(...compileResult.diagnostics);
    const activated = applyActivationOverlay(definition, {
        compilable: compileResult.compilable,
        reason: compileResult.reason
    });
    compiledDefinitions.push({
        canonicalKey: activated.canonicalKey,
        code: activated.resource.code,
        base: activated.resource.base,
        type: activated.resource.type,
        rawStatus: activated.rawStatus,
        effectiveStatus: activated.effectiveStatus,
        disableReason: activated.disableReason,
        expression: activated.resource.expression
    });
}

const merged = mergeDefinitions(
    compiledDefinitions.map((item, index) => ({
        ...definitions[index],
        effectiveStatus: item.effectiveStatus,
        disableReason: item.disableReason
    }))
);

const summary = {
    generatedAt: new Date().toISOString(),
    totalDefinitions: definitions.length,
    effectiveDefinitions: compiledDefinitions.filter((item) => item.effectiveStatus === "active").length,
    disabledDefinitions: compiledDefinitions.filter((item) => item.effectiveStatus === "disabled").length,
    compilableDefinitions: compiledDefinitions.filter((item) => item.effectiveStatus === "active").length,
    resolveGuardExpressions: compiledDefinitions.filter((item) =>
        (item.expression || "").includes("resolve() is")
    ).length,
    choiceAsExpressions: compiledDefinitions.filter((item) =>
        /\bas\s*\(/.test(item.expression || "") || /\bas\s+[A-Z]/.test(item.expression || "")
    ).length,
    conflictDiagnostics: merged.diagnostics.filter((item) => item.category === "conflict").length,
    compilerDiagnostics: compilerDiagnostics.length,
    diagnostics: compilerDiagnostics.slice(0, 200)
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
console.log(`Wrote compiler diagnostics summary to ${outputPath}`);
