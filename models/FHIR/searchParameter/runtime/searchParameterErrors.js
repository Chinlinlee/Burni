class UnknownSearchParameterError extends Error {
    /**
     * @param {string} parameterName
     * @param {string | string[]} [rawValue]
     */
    constructor(parameterName, rawValue = "") {
        const displayValue = Array.isArray(rawValue) ? rawValue.join(",") : rawValue;
        super(`Unknown search parameter ${parameterName} or value ${displayValue}`);
        this.name = "UnknownSearchParameterError";
        this.parameterName = parameterName;
        Error.captureStackTrace(this, this.constructor);
    }
}

class InvalidSearchParameterValueError extends Error {
    /**
     * @param {string} message
     */
    constructor(message) {
        super(message);
        this.name = "InvalidSearchParameterValueError";
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    UnknownSearchParameterError,
    InvalidSearchParameterValueError
};
