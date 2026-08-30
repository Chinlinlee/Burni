"use strict";

const { performance } = require("node:perf_hooks");

const enabled =
    process.env.TEST_TIMING === "1" || process.env.TEST_TIMING === "true";

const processWallStart = performance.now();

/** @type {Map<string, { totalMs: number, count: number, lastStart?: number }>} */
const phases = new Map();

/**
 * @typedef {{ key: string, setupMs: number, testsMs: number, teardownMs: number, testCount: number, teardownStart?: number }} SuiteRecord
 */

/** @type {SuiteRecord | null} */
let currentSuite = null;

/** @type {import("mocha").Suite | null} */
let currentSuiteRef = null;

/** @type {SuiteRecord[]} */
const suiteRecords = [];

let activeTestStart = 0;
let suiteSetupStart = 0;
let summaryPrinted = false;

const ORDERED_PHASES = [
    "process.hook.setup",
    "database.startup",
    "database.connect",
    "database.teardown",
    "process.teardown"
];

function isEnabled() {
    return enabled;
}

function now() {
    return performance.now();
}

/**
 * @param {string} name
 */
function startPhase(name) {
    if (!enabled) {
        return;
    }
    let entry = phases.get(name);
    if (!entry) {
        entry = { totalMs: 0, count: 0 };
        phases.set(name, entry);
    }
    entry.lastStart = now();
}

/**
 * @param {string} name
 */
function endPhase(name) {
    if (!enabled) {
        return;
    }
    const entry = phases.get(name);
    if (!entry || entry.lastStart === undefined) {
        return;
    }
    entry.totalMs += now() - entry.lastStart;
    entry.count += 1;
    entry.lastStart = undefined;
}

/**
 * @param {string} name
 * @param {number} durationMs
 */
function recordPhase(name, durationMs) {
    if (!enabled) {
        return;
    }
    let entry = phases.get(name);
    if (!entry) {
        entry = { totalMs: 0, count: 0 };
        phases.set(name, entry);
    }
    entry.totalMs += durationMs;
    entry.count += 1;
}

/**
 * @param {import("mocha").Suite} suite
 * @returns {string}
 */
function getSuiteKey(suite) {
    let root = suite;
    while (root.parent && root.parent.title) {
        root = root.parent;
    }
    const file = suite.file || root.file || "unknown";
    return `${file} :: ${root.title}`;
}

/**
 * @param {import("mocha").Suite} suite
 */
function onSuiteBegin(suite) {
    if (!enabled) {
        return;
    }
    if (currentSuiteRef === suite) {
        return;
    }

    finalizeCurrentSuite();

    currentSuiteRef = suite;
    suiteSetupStart = now();
    currentSuite = {
        key: getSuiteKey(suite),
        setupMs: 0,
        testsMs: 0,
        teardownMs: 0,
        testCount: 0
    };
}

function onTestBegin() {
    if (!enabled || !currentSuite) {
        return;
    }
    if (currentSuite.testCount === 0) {
        currentSuite.setupMs = now() - suiteSetupStart;
    }
    activeTestStart = now();
}

function onTestEnd() {
    if (!enabled || !currentSuite) {
        return;
    }
    currentSuite.testsMs += now() - activeTestStart;
    currentSuite.testCount += 1;
    currentSuite.teardownStart = now();
}

function finalizeCurrentSuite() {
    if (!currentSuite) {
        return;
    }
    if (currentSuite.teardownStart !== undefined) {
        currentSuite.teardownMs = now() - currentSuite.teardownStart;
    }
    suiteRecords.push(currentSuite);
    currentSuite = null;
    currentSuiteRef = null;
}

/**
 * @param {number} ms
 * @returns {string}
 */
function formatMs(ms) {
    if (ms >= 1000) {
        return `${(ms / 1000).toFixed(2)} s`;
    }
    return `${Math.round(ms)} ms`;
}

function printSummary() {
    if (!enabled || summaryPrinted) {
        return;
    }
    summaryPrinted = true;
    finalizeCurrentSuite();

    const wallMs = now() - processWallStart;
    const lines = [
        "",
        "[test-timing] Lifecycle summary",
        `  wall clock: ${formatMs(wallMs)}`,
        ""
    ];

    for (const name of ORDERED_PHASES) {
        const entry = phases.get(name);
        if (entry && entry.totalMs > 0) {
            const countSuffix = entry.count > 1 ? ` (${entry.count}x)` : "";
            lines.push(`  ${name}: ${formatMs(entry.totalMs)}${countSuffix}`);
        }
    }

    for (const [name, entry] of phases) {
        if (ORDERED_PHASES.includes(name) || entry.totalMs <= 0) {
            continue;
        }
        lines.push(`  ${name}: ${formatMs(entry.totalMs)} (${entry.count}x)`);
    }

    if (suiteRecords.length > 0) {
        lines.push("", `  suites (${suiteRecords.length}):`);
        for (const suite of suiteRecords) {
            lines.push(`    ${suite.key}`);
            lines.push(
                `      setup: ${formatMs(suite.setupMs)}, tests: ${formatMs(suite.testsMs)} (${suite.testCount} cases), teardown: ${formatMs(suite.teardownMs)}`
            );
        }
    }

    lines.push("");
    console.error(lines.join("\n"));
}

if (enabled) {
    process.on("exit", printSummary);
}

module.exports = {
    isEnabled,
    now,
    startPhase,
    endPhase,
    recordPhase,
    onSuiteBegin,
    onTestBegin,
    onTestEnd,
    finalizeCurrentSuite,
    printSummary
};
