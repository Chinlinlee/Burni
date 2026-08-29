const _ = require("lodash");
const moment = require("moment");
const momentTimezone = require("moment-timezone");

const {
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
} = require("./searchParameter/executor/queryPrimitives");

momentTimezone.tz.setDefault("UTC");
const prefix = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

function addressQuery(target, key) {
    const totalSplit = getCommaSplitArray(target);
    const ors = { $or: [] };
    for (const index in totalSplit) {
        const queryValue = stringQuery(totalSplit[index], key);
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
    const totalSplit = getCommaSplitArray(target);
    const ors = { $or: [] };

    for (const index in totalSplit) {
        const queryValue = stringQuery(totalSplit[index], key);
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

function timingQuery(value, field) {
    const fieldOfEvent = `${field}.event`;
    const fieldOfBoundsPeriod = `${field}.boundsPeriod`;
    const eventQuery = dateTimeQuery(value, fieldOfEvent);
    const boundsPeriodQuery = periodQuery(value, fieldOfBoundsPeriod);
    return {
        $or: [{ ...eventQuery }, { ...boundsPeriodQuery }]
    };
}

const instantQueryBuilder = {
    eq: (queryBuilder, field, date) => {
        queryBuilder[field] = { $eq: date };
        return queryBuilder;
    },
    ne: (queryBuilder, field, date) => {
        queryBuilder[field] = { $ne: date };
        return queryBuilder;
    },
    lt: (queryBuilder, field, date) => {
        queryBuilder[field] = { $lt: date };
        return queryBuilder;
    },
    gt: (queryBuilder, field, date) => {
        queryBuilder[field] = { $gt: date };
        return queryBuilder;
    },
    ge: (queryBuilder, field, date) => {
        queryBuilder[field] = { $gte: date };
        return queryBuilder;
    },
    le: (queryBuilder, field, date) => {
        queryBuilder[field] = { $lte: date };
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
    const isVaildDate = moment(new Date(date)).isValid();
    if (!isVaildDate) {
        return false;
    }
    if (date.includes("+")) {
        const dateSplitPlus = date.split("+");
        const inputTimezone = `-${dateSplitPlus.pop().replace(":", "")}`;
        const realDate = moment(dateSplitPlus.join("")).format("YYYY-MM-DDTHH:mm:ss.SSS");
        date = moment(realDate)
            .utc(true)
            .utcOffset(inputTimezone)
            .format("YYYY-MM-DDTHH:mm:ss.SSS");
    } else if (date.includes("-") && date.match(/:/g).length === 3) {
        const dateSplitHyphen = date.split("-");
        const inputTimezone = `+${dateSplitHyphen.pop().replace(":", "")}`;
        const realDate = moment(dateSplitHyphen.join("-")).format("YYYY-MM-DDTHH:mm:ss.SSS");
        date = moment(realDate)
            .utc(true)
            .utcOffset(inputTimezone)
            .format("YYYY-MM-DDTHH:mm:ss.SSS");
    } else {
        date = moment(date).format("YYYY-MM-DDTHH:mm:ss.SSS");
    }
    const dateObj = moment(date).utc(true).toDate();
    queryBuilder = instantQueryBuilder[queryPrefix](queryBuilder, field, dateObj, "");
    return queryBuilder;
}

function arrayStringBuild(query, field, queryField) {
    if (!_.isArray(query[field])) {
        query[field] = [query[field]];
    }
    for (const item of query[field]) {
        stringBuild(query, item, field, queryField);
    }
}

function stringBuild(query, item, field, queryField) {
    const buildResult = stringQuery(item, field);
    query.$and.push({
        [queryField]: buildResult
    });
}

module.exports = {
    stringQuery,
    numberQuery,
    tokenQuery,
    addressQuery,
    nameQuery,
    dateQuery,
    dateTimeQuery,
    instantQuery,
    periodQuery,
    timingQuery,
    quantityQuery,
    referenceQuery,
    arrayStringBuild,
    getCommaSplitArray,
    uriQuery
};
