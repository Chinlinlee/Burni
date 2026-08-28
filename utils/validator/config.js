const DEFAULT_VALIDATOR_TIMEOUT_MS = 30000;

/**
 * @param {string | undefined} timeoutMs
 * @returns {{ ok: true, value: number } | { ok: false }}
 */
function parseValidatorTimeoutMs(timeoutMs) {
    if (timeoutMs === undefined) {
        return { ok: true, value: DEFAULT_VALIDATOR_TIMEOUT_MS };
    }

    if (!/^[1-9]\d*$/.test(timeoutMs)) {
        return { ok: false };
    }

    return { ok: true, value: Number(timeoutMs) };
}

function getValidatorTimeoutMs() {
    const parsed = parseValidatorTimeoutMs(process.env.VALIDATOR_TIMEOUT_MS);
    return parsed.ok ? parsed.value : DEFAULT_VALIDATOR_TIMEOUT_MS;
}

/**
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateValidatorConfig() {
    if (process.env.ENABLE_VALIDATOR !== "true") {
        return { valid: true };
    }

    const validatorUrl = process.env.VALIDATOR_URL;
    if (!validatorUrl || !validatorUrl.trim()) {
        return { valid: false, error: "VALIDATOR_URL is required when ENABLE_VALIDATOR=true" };
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(validatorUrl);
    } catch {
        return { valid: false, error: "VALIDATOR_URL must be an absolute http or https URL" };
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return { valid: false, error: "VALIDATOR_URL must be an absolute http or https URL" };
    }

    if (process.env.VALIDATOR_TIMEOUT_MS !== undefined) {
        const timeoutResult = parseValidatorTimeoutMs(process.env.VALIDATOR_TIMEOUT_MS);
        if (!timeoutResult.ok) {
            return { valid: false, error: "VALIDATOR_TIMEOUT_MS must be a positive integer" };
        }
    }

    return { valid: true };
}

function assertValidatorConfig() {
    const result = validateValidatorConfig();
    if (!result.valid) {
        console.error(result.error);
        process.exit(1);
    }
}

module.exports = {
    assertValidatorConfig,
    getValidatorTimeoutMs,
    parseValidatorTimeoutMs,
    validateValidatorConfig
};
