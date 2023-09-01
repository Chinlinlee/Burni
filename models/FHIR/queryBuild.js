const { isNumber } = require("lodash");
const _ = require("lodash");
const moment = require("moment");
const momentTimezone = require("moment-timezone");
const prefix = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

/**
 *
 * @param {string} value
 */
function getCommaSplitArray(value) {
    value = value.replace(/\\,/g, "{ＣＯＭＭＡ}");
    let valueCommaSplit = value
        .split(",")
        .map((v) => v.replace(/{ＣＯＭＭＡ}/gm, ","));
    return valueCommaSplit;
}

/**
 *
 * @param {string} str value
 * @param {string} key field name
 * @returns
 */
function stringQuery(str, key) {
    let keySplit = key.split(":");
    const buildContainsOrExact = {
        contains: stringContains,
        exact: stringExact
    };
    let buildFunc = {
        1: () => {
            return stringContainStart(str);
        },
        2: () => {
            let modifier = keySplit[1];
            return buildContainsOrExact[modifier](str);
        }
    };
    return buildFunc[keySplit.length]();
}

function stringContainStart(str) {
    str = str.replace(/[\\(\\)\\-\\_\\+\\=\\\/\\.]/g, "\\$&");
    str = str.replace(/[\*]/g, "\\.$&");
    str = `^${str}`;
    return { $regex: new RegExp(str, "gi") };
}
function stringContains(str) {
    str = str.replace(/[\\(\\)\\-\\_\\+\\=\\\/\\.]/g, "\\$&");
    str = str.replace(/[\*]/g, "\\.$&");
    return { $regex: new RegExp(str, "gi") };
}
function stringExact(str) {
    str = str.replace(/[\\(\\)\\-\\_\\+\\=\\\/\\.]/g, "\\$&");
    str = str.replace(/[\*]/g, "\\.$&");
    return str;
}

/**
 *
 * @param {string} item The query value
 * @param {string} type postfix of field e.g. field of parameter of phone in Patient is `telecom` but use query value with `telecom.value`
 * @param {string} field
 * @param {string} required The fixed system e.g. phone is telecom and email is email
 * @param {boolean} isCodeableConcept if is codeable concept
 * @returns
 */
function tokenQuery(item, type, field, required, isCodeableConcept = false) {
    let queryBuilder = {};
    let system = "";
    let value = "";
    item = item.replace(/\\\|/gm, "{ＯＲ}");
    if (item.includes("|")) [system, value] = item.split("|");
    else value = item;
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
        if (value == "true" || value == "false") {
            value = value === "true";
        }
        if (type) {
            queryBuilder[`${field}.${type}`] = value;
        } else {
            queryBuilder[`${field}`] = value;
        }
    }
    if (system && value) {
        let andQuery = {
            $and: []
        };
        for (let i in queryBuilder) {
            andQuery.$and.push({
                [i]: queryBuilder[i]
            });
        }
        return andQuery;
    }
    return queryBuilder;
}

function quantityQuery(item, field) {
    let queryBuilder = {};
    let system = "";
    let code = "";
    let value = "";
    item = item.replace(/\\\|/gm, "{ＯＲ}");
    if (item.includes("|"))
        [value = "", system = "", code = ""] = item.split("|");
    else value = item;
    value = value.replace(/{ＯＲ}/gm, "|");
    system = system.replace(/{ＯＲ}/gm, "|");
    code = code.replace(/{ＯＲ}/gm, "|");
    if (system) {
        queryBuilder[`${field}.system`] = system;
    }
    if (code) {
        queryBuilder[`${field}.code`] = code;
    }
    let tempNumberQuery = numberQuery(value, field);
    if (!tempNumberQuery) {
        return false;
    }
    queryBuilder[`${field}.value`] = tempNumberQuery[field];
    if (system || code) {
        let andQuery = {
            $and: []
        };
        for (let i in queryBuilder) {
            andQuery.$and.push({
                [i]: queryBuilder[i]
            });
        }
        return andQuery;
    }
    return queryBuilder;
}

function addressQuery(target, key) {
    // Tokenize the input as mush as possible
    let totalSplit = getCommaSplitArray(target);
    let ors = { $or: [] };
    for (let index in totalSplit) {
        let queryValue = stringQuery(totalSplit[index], key);
        ors.$or.push(
            { "address.line": queryValue },
            { "address.city": queryValue },
            { "address.district": queryValue },
            { "address.state": queryValue },
            { "address.postalCode": queryValue },
            { "address.country": queryValue }
        );
    }
    return ors;
}

function nameQuery(target, key) {
    let totalSplit = getCommaSplitArray(target);
    let ors = { $or: [] };

    for (let index in totalSplit) {
        let queryValue = stringQuery(totalSplit[index], key);
        ors.$or.push(
            { "name.text": queryValue },
            { "name.family": queryValue },
            { "name.given": queryValue },
            { "name.suffix": queryValue },
            { "name.prefix": queryValue }
        );
    }
    return ors;
}

let dateQueryBuilder = {
    eq: (queryBuilder, field, date, format) => {
        let gte = moment(date).startOf(format);
        let lte = moment(date).endOf(format);
        let result = {
            $gte: gte.toDate(),
            $lte: lte.toDate()
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    ne: (queryBuilder, field, date, format) => {
        let gd = moment(date).set(format, moment(date).get(format) + 1);
        let ld = moment(date).set(format, moment(date).get(format) - 1);
        let result = {
            $or: [
                {
                    [field]: {
                        $gte: moment(gd).toDate()
                    }
                },
                {
                    [field]: {
                        $lte: moment(ld).toDate()
                    }
                }
            ]
        };
        queryBuilder = result;
        return queryBuilder;
    },
    lt: (queryBuilder, field, date, format) => {
        let result = {
            $lt: moment(date).toDate()
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    gt: (queryBuilder, field, date, format) => {
        let result = {
            $gt: moment(date).toDate()
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    ge: (queryBuilder, field, date, format) => {
        let result = {
            $gte: moment(date).toDate()
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    le: (queryBuilder, field, date, format) => {
        let result = {
            $lte: moment(date).toDate()
        };
        queryBuilder[field] = result;
        return queryBuilder;
    }
};
function dateQuery(value, field) {
    let queryBuilder = {};
    let date = value.substring(2);
    let queryPrefix = value.substring(0, 2);
    if (prefix.indexOf(queryPrefix) < 0) {
        queryPrefix = "eq";
        date = value;
    }
    let isValidDate = moment(new Date(date)).isValid();
    if (!isValidDate) {
        return false;
    }

    let momentYYYYDate = moment(date, "YYYY", true);
    let momentYYYYMMDate = moment(date, "YYYY-MM", true);
    let momentYYYYMMDDDate = moment(date, "YYYY-MM-DD", true);
    let momentValidArr = [
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
    let inputFormat = ["year", "month", "date"];
    queryBuilder = dateQueryBuilder[queryPrefix](
        queryBuilder,
        field,
        date,
        inputFormat[momentValidIndex]
    );
    return queryBuilder;
}
function dateTimeQuery(value, field) {
    let queryBuilder = {};
    let dateTimeRegex =
        /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?/gm;
    if (!dateTimeRegex.test(value)) {
        return false;
    }

    let date = value.substring(2);
    let queryPrefix = value.substring(0, 2);
    if (prefix.indexOf(queryPrefix) < 0) {
        queryPrefix = "eq";
        date = value;
    }
    let isValidDate = moment(new Date(date)).isValid();
    if (!isValidDate) {
        return false;
    }

    let momentYYYYDate = moment(date, "YYYY", true);
    let momentYYYYMMDate = moment(date, "YYYY-MM", true);
    let momentYYYYMMDDDate = moment(date, "YYYY-MM-DD", true);
    let momentValidArr = [
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
    let inputFormat = ["year", "month", "date"];
    queryBuilder = dateQueryBuilder[queryPrefix](
        queryBuilder,
        field,
        date,
        inputFormat[momentValidIndex]
    );
    return queryBuilder;
}
/**
 *
 * @param {string} value value of query date
 * @param {string} field field of query
 */
function periodQuery(value, field) {
    let fieldOfStart = `${field}.start`;
    let fieldOfEnd = `${field}.end`;
    let queryOfStart = dateTimeQuery(value, fieldOfStart);
    let queryOfEnd = dateTimeQuery(value, fieldOfEnd);
    let query = {
        $or: [
            {
                ...queryOfStart
            },
            {
                ...queryOfEnd
            }
        ]
    };
    return query;
}

/**
 *
 * @param {string} value value of query date
 * @param {string} field field of query
 */
function timingQuery(value, field) {
    let fieldOfEvent = `${field}.event`;
    let fieldOfBoundsPeriod = `${field}.boundsPeriod`;
    let eventQuery = dateTimeQuery(value, fieldOfEvent);
    let boundsPeriodQuery = periodQuery(value, fieldOfBoundsPeriod);
    let query = {
        $or: [
            {
                ...eventQuery
            },
            {
                ...boundsPeriodQuery
            }
        ]
    };
}
let instantQueryBuilder = {
    eq: (queryBuilder, field, date) => {
        let result = {
            $eq: date
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    ne: (queryBuilder, field, date) => {
        let result = {
            $ne: date
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    lt: (queryBuilder, field, date) => {
        let result = {
            $lt: date
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    gt: (queryBuilder, field, date) => {
        let result = {
            $gt: date
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    ge: (queryBuilder, field, date) => {
        let result = {
            $gte: date
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    le: (queryBuilder, field, date) => {
        let result = {
            $lte: date
        };
        queryBuilder[field] = result;
        return queryBuilder;
    }
};

function instantQuery(value, field) {
    let queryBuilder = {};
    let date = value.substring(2);
    let queryPrefix = value.substring(0, 2);
    if (prefix.indexOf(queryPrefix) < 0) {
        queryPrefix = "eq";
        date = value;
    }
    let isVaildDate = moment(new Date(date)).isValid();
    if (!isVaildDate) {
        return false;
    }
    if (date.includes("+")) {
        let dateSplitPlus = date.split("+");
        let inputTimezone = `-${dateSplitPlus.pop().replace(":", "")}`;
        let realDate = moment(dateSplitPlus.join("")).format(
            "YYYY-MM-DDTHH:mm:ss.SSS"
        );
        date = moment(realDate)
            .utc(true)
            .utcOffset(inputTimezone)
            .format("YYYY-MM-DDTHH:mm:ss.SSS");
    } else if (date.includes("-") && date.match(/:/g).length == 3) {
        let dateSplitHyphen = date.split("-");
        let inputTimezone = `+${dateSplitHyphen.pop().replace(":", "")}`;
        let realDate = moment(dateSplitHyphen.join("-")).format(
            "YYYY-MM-DDTHH:mm:ss.SSS"
        );
        date = moment(realDate)
            .utc(true)
            .utcOffset(inputTimezone)
            .format("YYYY-MM-DDTHH:mm:ss.SSS");
    } else {
        date = moment(date).format("YYYY-MM-DDTHH:mm:ss.SSS");
    }
    let dateObj = moment(date).utc(true).toDate();
    queryBuilder = instantQueryBuilder[queryPrefix](
        queryBuilder,
        field,
        dateObj,
        ""
    );
    return queryBuilder;
}

function referenceQuery(query, field, type = "") {
    const urlRegex = /^(http|https):\/\/(.*)\/(\w+\/.+)$/;
    const isUrl = query.match(urlRegex);
    let typeAndId = query.split("/");
    let queryBuilder = {};
    if (isUrl) {
        _.set(queryBuilder, field, isUrl[3]);
        queryBuilder[field] = isUrl[3];
        return queryBuilder;
    } else if (typeAndId.length == 2) {
        queryBuilder[field] = `${typeAndId[0]}/${typeAndId[1]}`;
    } else {
        queryBuilder[field] = { $regex: new RegExp(query) };
    }
    if (type) {
        let andQuery = {
            $and: []
        };
        let typeField = field.substring(0, field.lastIndexOf(".")) + ".type";
        queryBuilder[typeField] = type;
        andQuery.$and.push({
            [typeField]: queryBuilder[typeField]
        });
        andQuery.$and.push({
            [field]: queryBuilder[field]
        });
        return andQuery;
    }
    return queryBuilder;
}
function arrayStringBuild(query, field, queryField) {
    if (!_.isArray(query[field])) {
        query[field] = [query[field]];
    }
    for (let item of query[field]) {
        stringBuild(query, item, field, queryField);
    }
}
function stringBuild(query, item, field, queryField) {
    let buildResult = stringQuery(item, field);
    query.$and.push({
        [queryField]: buildResult
    });
}

let numberQueryBuilder = {
    eq: (queryBuilder, field, num) => {
        let result = {
            $eq: Number(num)
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    ne: (queryBuilder, field, num) => {
        let result = {
            $ne: Number(num)
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    gt: (queryBuilder, field, num) => {
        let result = {
            $gt: Number(num)
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    lt: (queryBuilder, field, num) => {
        let result = {
            $lt: Number(num)
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    ge: (queryBuilder, field, num) => {
        let result = {
            $gte: Number(num)
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    le: (queryBuilder, field, num) => {
        let result = {
            $lte: Number(num)
        };
        queryBuilder[field] = result;
        return queryBuilder;
    },
    sa: (queryBuilder, field, num) => {
        return new Error("not support prefix");
    },
    eb: (queryBuilder, field, num) => {
        return new Error("not support prefix");
    },
    ap: (queryBuilder, field, num) => {
        return new Error("not support prefix");
    }
};
function numberQuery(value, field) {
    try {
        let queryBuilder = {};
        let num = value.substring(2);
        let queryPrefix = value.substring(0, 2);
        if (isNumber(Number(queryPrefix))) {
            queryPrefix = "eq";
            num = value;
        }
        queryBuilder = numberQueryBuilder[queryPrefix](
            queryBuilder,
            field,
            num
        );
        return queryBuilder;
    } catch (e) {
        return false;
    }
}

module.exports = {
    stringQuery: stringQuery,
    numberQuery: numberQuery,
    tokenQuery: tokenQuery,
    addressQuery: addressQuery,
    nameQuery: nameQuery,
    dateQuery: dateQuery,
    dateTimeQuery: dateTimeQuery,
    instantQuery: instantQuery,
    periodQuery: periodQuery,
    timingQuery: timingQuery,
    quantityQuery: quantityQuery,
    referenceQuery: referenceQuery,
    arrayStringBuild: arrayStringBuild,
    getCommaSplitArray: getCommaSplitArray
};
