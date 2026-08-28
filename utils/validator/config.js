const DEFAULT_VALIDATOR_TIMEOUT_MS = 30000;

function getValidatorTimeoutMs() {
    const timeoutMs = process.env.VALIDATOR_TIMEOUT_MS;
    if (timeoutMs === undefined || timeoutMs === "") {
        return DEFAULT_VALIDATOR_TIMEOUT_MS;
    }
    return Number(timeoutMs);
}

function assertValidatorConfig() {
    if (process.env.ENABLE_VALIDATOR !== "true") {
        return;
    }

    const validatorUrl = process.env.VALIDATOR_URL;
    if (!validatorUrl || !validatorUrl.trim()) {
        console.error("VALIDATOR_URL is required when ENABLE_VALIDATOR=true");
        process.exit(1);
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(validatorUrl);
    } catch {
        console.error("VALIDATOR_URL must be an absolute http or https URL");
        process.exit(1);
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        console.error("VALIDATOR_URL must be an absolute http or https URL");
        process.exit(1);
    }

    const timeoutMs = process.env.VALIDATOR_TIMEOUT_MS;
    if (timeoutMs === undefined || timeoutMs === "") {
        return;
    }

    if (!/^[1-9]\d*$/.test(timeoutMs)) {
        console.error("VALIDATOR_TIMEOUT_MS must be a positive integer");
        process.exit(1);
    }
}

module.exports = {
    assertValidatorConfig,
    getValidatorTimeoutMs
};
