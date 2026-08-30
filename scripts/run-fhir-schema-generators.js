#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function runNode(scriptRelative, extraArgs = []) {
    const scriptPath = path.join(repoRoot, scriptRelative);
    execFileSync(process.execPath, [scriptPath, ...extraArgs], {
        cwd: repoRoot,
        stdio: 'inherit'
    });
}

function runResourceModels() {
    const fhirgen = require(path.join(repoRoot, 'FHIR-mongoose-Models-Generator/resourceGenerator'));
    const config = require(path.join(repoRoot, 'config/config'));
    for (const res of Object.keys(config)) {
        fhirgen(res, { resourcePath: './models/mongodb/model' });
    }
}

function main() {
    runNode('FHIR-mongoose-Models-Generator/PrimitiveGenerator.js');
    runNode('FHIR-mongoose-Models-Generator/ComplexGenerator.js');
    runResourceModels();
    require(path.join(repoRoot, 'api_generator/history_model_Generator')).genHistoryModel();
}

main();
