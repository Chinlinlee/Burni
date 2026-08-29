/**
 * @param {Object} [options]
 * @param {Object} [options.body]
 * @param {Object} [options.query]
 * @param {Object} [options.params]
 * @param {string} [options.originalUrl]
 * @param {string} [options.url]
 * @param {Record<string, string>} [options.headers]
 */
function createFakeRequest(options = {}) {
    const headers = { accept: "application/fhir+json", ...(options.headers || {}) };
    const query = { ...(options.query || {}) };

    return {
        body: options.body,
        query,
        params: options.params || {},
        protocol: "http",
        originalUrl: options.originalUrl || "/Patient",
        url: options.url || "/Patient",
        headers,
        get(name) {
            const lower = name.toLowerCase();
            if (lower === "host") {
                return "localhost";
            }
            if (lower === "accept") {
                return headers.accept;
            }
            return headers[name] || headers[lower];
        }
    };
}

function createFakeResponse() {
    const state = {
        statusCode: 200,
        headers: { "content-type": "application/fhir+json" },
        body: null
    };

    return {
        locals: {},
        getHeader(name) {
            return state.headers[name.toLowerCase()] || state.headers[name];
        },
        setHeader(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        set(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        header(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        append(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        status(code) {
            state.statusCode = code;
            return this;
        },
        send(body) {
            state.body = body;
            return body;
        },
        getState() {
            return state;
        }
    };
}

module.exports = {
    createFakeRequest,
    createFakeResponse
};
