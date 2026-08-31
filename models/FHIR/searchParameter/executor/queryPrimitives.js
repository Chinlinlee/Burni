const { URL } = require("url");

const { getUrlMatch } = require("@root/utils/fhir-url");
const { parseTemporalQueryValue } = require("./temporalQueryParser");
const {
    buildTemporalFilter,
    buildPeriodTemporalFilter
} = require("./temporalQueryFilter");

const COMPARATOR_PREFIXES = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

/**
 * @param {string} value
 * @returns {string[]}
 */
function getCommaSplitArray(value) {
    value = value.replace(/\\,/g, "{ＣＯＭＭＡ}");
    return value.split(",").map((entry) => entry.replace(/{ＣＯＭＭＡ}/gm, ","));
}

/**
 * @param {string} str
 * @returns {Object}
 */
function stringContainStart(str) {
    str = str.replace(/[\\(\\)\\-\\_\\+\\=\\\/\\.]/g, "\\$&");
    str = str.replace(/[\*]/g, "\\.$&");
    str = `^${str}`;
    return { $regex: new RegExp(str, "gi") };
}

/**
 * @param {string} str
 * @returns {Object}
 */
function stringContains(str) {
    str = str.replace(/[\\(\\)\\-\\_\\+\\=\\\/\\.]/g, "\\$&");
    str = str.replace(/[\*]/g, "\\.$&");
    return { $regex: new RegExp(str, "gi") };
}

/**
 * @param {string} str
 * @returns {string}
 */
function stringExact(str) {
    str = str.replace(/[\\(\\)\\-\\_\\+\\=\\\/\\.]/g, "\\$&");
    str = str.replace(/[\*]/g, "\\.$&");
    return str;
}

/**
 * @param {string} str
 * @param {string} key
 * @returns {Object | string}
 */
function stringQuery(str, key) {
    const keySplit = key.split(":");
    const buildContainsOrExact = {
        contains: stringContains,
        exact: stringExact
    };
    const buildFunc = {
        1: () => stringContainStart(str),
        2: () => {
            const modifier = keySplit[1];
            return buildContainsOrExact[modifier](str);
        }
    };
    return buildFunc[keySplit.length]();
}

/**
 * @param {string} item
 * @param {string} type
 * @param {string} field
 * @param {string} required
 * @param {boolean} [isCodeableConcept=false]
 * @returns {Object}
 */
function tokenQuery(item, type, field, required, isCodeableConcept = false) {
    const queryBuilder = {};
    let system = "";
    let value = "";
    item = item.replace(/\\\|/gm, "{ＯＲ}");
    if (item.includes("|")) {
        [system, value] = item.split("|");
    } else {
        value = item;
    }
    system = system.replace(/{ＯＲ}/gm, "|");
    value = value.replace(/{ＯＲ}/gm, "|");
    if (required) {
        system = required;
    }
    if (system) {
        if (isCodeableConcept) {
            queryBuilder[`${field}.coding.system`] = system;
        } else {
            queryBuilder[`${field}.system`] = system;
        }
    }
    if (value) {
        if (value === "true" || value === "false") {
            value = value === "true";
        }
        if (type) {
            queryBuilder[`${field}.${type}`] = value;
        } else {
            queryBuilder[field] = value;
        }
    }
    if (system && value) {
        const andQuery = { $and: [] };
        for (const key of Object.keys(queryBuilder)) {
            andQuery.$and.push({ [key]: queryBuilder[key] });
        }
        return andQuery;
    }
    return queryBuilder;
}

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object | false}
 */
function dateQuery(value, field) {
    try {
        const temporal = parseTemporalQueryValue(value, "date");
        return buildTemporalFilter(field, "date", temporal, temporal.comparator);
    } catch {
        return false;
    }
}

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object | false}
 */
function dateTimeQuery(value, field) {
    try {
        const temporal = parseTemporalQueryValue(value, "dateTime");
        return buildTemporalFilter(field, "dateTime", temporal, temporal.comparator);
    } catch {
        return false;
    }
}

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object}
 */
function periodQuery(value, field) {
    const temporal = parseTemporalQueryValue(value, "dateTime");
    return buildPeriodTemporalFilter(field, temporal, temporal.comparator);
}

const numberQueryBuilder = {
    eq: (queryBuilder, field, num) => {
        queryBuilder[field] = { $eq: Number(num) };
        return queryBuilder;
    },
    ne: (queryBuilder, field, num) => {
        queryBuilder[field] = { $ne: Number(num) };
        return queryBuilder;
    },
    gt: (queryBuilder, field, num) => {
        queryBuilder[field] = { $gt: Number(num) };
        return queryBuilder;
    },
    lt: (queryBuilder, field, num) => {
        queryBuilder[field] = { $lt: Number(num) };
        return queryBuilder;
    },
    ge: (queryBuilder, field, num) => {
        queryBuilder[field] = { $gte: Number(num) };
        return queryBuilder;
    },
    le: (queryBuilder, field, num) => {
        queryBuilder[field] = { $lte: Number(num) };
        return queryBuilder;
    },
    sa: () => new Error("not support prefix"),
    eb: () => new Error("not support prefix"),
    ap: () => new Error("not support prefix")
};

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object | false}
 */
function numberQuery(value, field) {
    try {
        let queryBuilder = {};
        let num = value.substring(2);
        let queryPrefix = value.substring(0, 2);
        if (COMPARATOR_PREFIXES.indexOf(queryPrefix) < 0) {
            queryPrefix = "eq";
            num = value;
        }
        queryBuilder = numberQueryBuilder[queryPrefix](queryBuilder, field, num);
        return queryBuilder;
    } catch {
        return false;
    }
}

/**
 * @param {string} item
 * @param {string} field
 * @returns {Object | false}
 */
function quantityQuery(item, field) {
    const queryBuilder = {};
    let system = "";
    let code = "";
    let value = "";
    item = item.replace(/\\\|/gm, "{ＯＲ}");
    if (item.includes("|")) {
        [value = "", system = "", code = ""] = item.split("|");
    } else {
        value = item;
    }
    value = value.replace(/{ＯＲ}/gm, "|");
    system = system.replace(/{ＯＲ}/gm, "|");
    code = code.replace(/{ＯＲ}/gm, "|");
    if (system) {
        queryBuilder[`${field}.system`] = system;
    }
    if (code) {
        queryBuilder[`${field}.code`] = code;
    }
    const tempNumberQuery = numberQuery(value, field);
    if (!tempNumberQuery) {
        return false;
    }
    queryBuilder[`${field}.value`] = tempNumberQuery[field];
    if (system || code) {
        const andQuery = { $and: [] };
        for (const key of Object.keys(queryBuilder)) {
            andQuery.$and.push({ [key]: queryBuilder[key] });
        }
        return andQuery;
    }
    return queryBuilder;
}

/**
 * @param {string} query
 * @param {string} field
 * @param {string} [type=""]
 * @returns {Object}
 */
function referenceQuery(query, field, type = "") {
    const urlMatch = getUrlMatch(query);
    const typeAndId = query.split("/");
    const queryBuilder = {};

    if (urlMatch) {
        queryBuilder[field] = urlMatch[0];
        return queryBuilder;
    }
    if (typeAndId.length === 2) {
        queryBuilder[field] = `${typeAndId[0]}/${typeAndId[1]}`;
    } else {
        queryBuilder[field] = { $regex: new RegExp(query) };
    }

    if (type) {
        const andQuery = { $and: [] };
        const typeField = `${field.substring(0, field.lastIndexOf("."))}.type`;
        queryBuilder[typeField] = type;
        andQuery.$and.push({ [typeField]: queryBuilder[typeField] });
        andQuery.$and.push({ [field]: queryBuilder[field] });
        return andQuery;
    }
    return queryBuilder;
}

/**
 * @param {string} value
 * @param {string} field
 * @returns {string | string[] | Object}
 */
function uriQuery(value, field) {
    const url = new URL(value);

    if (field.includes(":below")) {
        const escapedUrl = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
            $regex: new RegExp(`^${escapedUrl}(\\/.*)?$`, "i")
        };
    }
    if (field.includes(":above")) {
        const expectedUrls = [];
        const pathnameSplit = url.pathname.split("/");
        for (let index = 0; index < pathnameSplit.length; index += 1) {
            expectedUrls.push(`${url.origin}${pathnameSplit.slice(0, index + 1).join("/")}`);
        }
        return expectedUrls;
    }
    return value;
}

module.exports = {
    getCommaSplitArray,
    stringQuery,
    tokenQuery,
    numberQuery,
    dateQuery,
    dateTimeQuery,
    periodQuery,
    quantityQuery,
    referenceQuery,
    uriQuery
};
