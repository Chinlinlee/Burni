const { URL } = require("url");

const { getUrlMatch } = require("@root/utils/fhir-url");
const moment = require("moment");
const momentTimezone = require("moment-timezone");

momentTimezone.tz.setDefault("UTC");

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

const dateQueryBuilder = {
    eq: (queryBuilder, field, date, format) => {
        const rangeStart = moment(date).startOf(format);
        const rangeEnd = moment(date).endOf(format);
        if (format === "date") {
            queryBuilder[field] = {
                $gte: rangeStart.format("YYYY-MM-DD"),
                $lt: rangeEnd.clone().add(1, "day").format("YYYY-MM-DD")
            };
            return queryBuilder;
        }
        if (format === "month") {
            queryBuilder[field] = {
                $gte: rangeStart.format("YYYY-MM"),
                $lt: rangeEnd.clone().add(1, "month").format("YYYY-MM")
            };
            return queryBuilder;
        }

        queryBuilder[field] = {
            $gte: rangeStart.format("YYYY"),
            $lt: rangeEnd.clone().add(1, "year").format("YYYY")
        };
        return queryBuilder;
    },
    ne: (queryBuilder, field, date, format) => {
        const eqQuery = {};
        dateQueryBuilder.eq(eqQuery, field, date, format);
        queryBuilder = {
            $nor: [eqQuery]
        };
        return queryBuilder;
    },
    lt: (queryBuilder, field, date) => {
        queryBuilder[field] = { $lt: moment(date).format("YYYY-MM-DD") };
        return queryBuilder;
    },
    gt: (queryBuilder, field, date) => {
        queryBuilder[field] = { $gte: moment(date).clone().add(1, "day").format("YYYY-MM-DD") };
        return queryBuilder;
    },
    ge: (queryBuilder, field, date) => {
        queryBuilder[field] = { $gte: moment(date).format("YYYY-MM-DD") };
        return queryBuilder;
    },
    le: (queryBuilder, field, date) => {
        queryBuilder[field] = { $lt: moment(date).clone().add(1, "day").format("YYYY-MM-DD") };
        return queryBuilder;
    }
};

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object | false}
 */
function dateQuery(value, field) {
    let queryBuilder = {};
    let date = value.substring(2);
    let queryPrefix = value.substring(0, 2);
    if (COMPARATOR_PREFIXES.indexOf(queryPrefix) < 0) {
        queryPrefix = "eq";
        date = value;
    }
    if (!moment(new Date(date)).isValid()) {
        return false;
    }

    const momentYYYYDate = moment(date, "YYYY", true);
    const momentYYYYMMDate = moment(date, "YYYY-MM", true);
    const momentYYYYMMDDDate = moment(date, "YYYY-MM-DD", true);
    const momentValidArr = [
        momentYYYYDate.isValid(),
        momentYYYYMMDate.isValid(),
        momentYYYYMMDDDate.isValid()
    ];
    let momentValidIndex = momentValidArr.indexOf(true);
    if (momentValidIndex < 0) {
        return false;
    }
    if (moment(date, moment.ISO_8601, true).isValid()) {
        date = moment(date).format();
    } else if (moment(date, "YYYY", true).isValid()) {
        date = moment(new Date(date), moment.ISO_8601).format();
    }
    const inputFormat = ["year", "month", "date"];
    queryBuilder = dateQueryBuilder[queryPrefix](
        queryBuilder,
        field,
        date,
        inputFormat[momentValidIndex]
    );
    return queryBuilder;
}

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object | false}
 */
function dateTimeQuery(value, field) {
    let queryBuilder = {};
    const dateTimeRegex =
        /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?/gm;
    if (!dateTimeRegex.test(value)) {
        return false;
    }

    let date = value.substring(2);
    let queryPrefix = value.substring(0, 2);
    if (COMPARATOR_PREFIXES.indexOf(queryPrefix) < 0) {
        queryPrefix = "eq";
        date = value;
    }
    if (!moment(new Date(date)).isValid()) {
        return false;
    }

    const momentYYYYDate = moment(date, "YYYY", true);
    const momentYYYYMMDate = moment(date, "YYYY-MM", true);
    const momentYYYYMMDDDate = moment(date, "YYYY-MM-DD", true);
    const momentValidArr = [
        momentYYYYDate.isValid(),
        momentYYYYMMDate.isValid(),
        momentYYYYMMDDDate.isValid()
    ];
    let momentValidIndex = momentValidArr.indexOf(true);
    if (momentValidIndex < 0) {
        momentValidIndex = 2;
    }
    if (moment(date, moment.ISO_8601, true).isValid()) {
        date = moment(date).format();
    } else if (moment(date, "YYYY", true).isValid()) {
        date = moment(new Date(date), moment.ISO_8601).format();
    }
    const inputFormat = ["year", "month", "date"];
    queryBuilder = dateQueryBuilder[queryPrefix](
        queryBuilder,
        field,
        date,
        inputFormat[momentValidIndex]
    );
    return queryBuilder;
}

/**
 * @param {string} value
 * @param {string} field
 * @returns {Object}
 */
function periodQuery(value, field) {
    const fieldOfStart = `${field}.start`;
    const fieldOfEnd = `${field}.end`;
    const queryOfStart = dateTimeQuery(value, fieldOfStart);
    const queryOfEnd = dateTimeQuery(value, fieldOfEnd);
    return {
        $or: [{ ...queryOfStart }, { ...queryOfEnd }]
    };
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
