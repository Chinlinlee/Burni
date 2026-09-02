/**
 * Mongo `$function` cannot `require()` Node modules, so calendar and decimal
 * helpers must stay nested here. Node callers use calendar.js / arithmetic.js;
 * this function exists so `.toString()` is a valid `{ lang: "js" }` body.
 *
 * MongoDB cannot invoke the application-side canonical validators while
 * matching a document, so the same value/precision/boundary checks run in the
 * server-side expression and a raw field or superficially shaped object does
 * not count as a searchable value.
 *
 * @param {unknown} value
 * @param {"date" | "dateTime" | "instant"} type
 * @returns {boolean}
 */
function canonicalTemporalValueMatches(value, type) {
    if (Array.isArray(value)) {
        return value.some((entry) => canonicalTemporalValueMatches(entry, type));
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    if (type === "Period") {
        return (
            (Object.prototype.hasOwnProperty.call(value, "start") ||
                Object.prototype.hasOwnProperty.call(value, "end")) &&
            (!Object.prototype.hasOwnProperty.call(value, "start") ||
                canonicalTemporalValueMatches(value.start, "dateTime")) &&
            (!Object.prototype.hasOwnProperty.call(value, "end") ||
                canonicalTemporalValueMatches(value.end, "dateTime"))
        );
    }

    const allowedFields =
        type === "date"
            ? ["value", "precision", "normalizedStart", "normalizedEnd"]
            : type === "dateTime"
              ? ["value", "precision", "fractionDigits", "normalizedStart", "normalizedEnd"]
              : ["value", "precision", "fractionDigits", "epochSeconds"];
    if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
        return false;
    }

    const datePattern =
        /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/;
    const dateTimePattern =
        /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[1-2][0-9]|3[0-1])(?:T([01][0-9]|2[0-3]):[0-5][0-9](?::([0-5][0-9]|60)(?:\.[0-9]+)?)?(?:Z|(?:\+|-)(?:(?:0[0-9]|1[0-3]):[0-5][0-9]|14:00))?)?)?)?$/;
    const instantPattern =
        /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/;
    const isLeapYear = (year) =>
        year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = (year, month) =>
        month === 2
            ? isLeapYear(year)
                ? 29
                : 28
            : [4, 6, 9, 11].includes(month)
              ? 30
              : 31;
    const isCalendarDate = (calendarDate) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
            return false;
        }
        const [year, month, day] = calendarDate.split("-").map(Number);
        return (
            year >= 1 &&
            year <= 9999 &&
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= daysInMonth(year, month)
        );
    };
    const formatCalendarDate = (date) =>
        [
            String(date.getUTCFullYear()).padStart(4, "0"),
            String(date.getUTCMonth() + 1).padStart(2, "0"),
            String(date.getUTCDate()).padStart(2, "0")
        ].join("-");
    const addCalendarDays = (calendarDate, days) => {
        const [year, month, day] = calendarDate.split("-").map(Number);
        if (year === 9999 && month === 12 && day + days > 31) {
            return "9999-12-31";
        }
        const date = new Date(0);
        date.setUTCFullYear(year, month - 1, day + days);
        if (date.getUTCFullYear() > 9999) {
            return "9999-12-31";
        }
        return formatCalendarDate(date);
    };
    const dateBoundaries = (rawValue, precision) => {
        if (precision === "year") {
            const year = Number(rawValue);
            return {
                start: `${rawValue}-01-01`,
                end:
                    year === 9999
                        ? "9999-12-31"
                        : `${String(year + 1).padStart(4, "0")}-01-01`
            };
        }
        if (precision === "month") {
            const [year, month] = rawValue.split("-").map(Number);
            if (year === 9999 && month === 12) {
                return {
                    start: `${rawValue}-01`,
                    end: "9999-12-31"
                };
            }
            const date = new Date(0);
            date.setUTCFullYear(year, month, 1);
            return {
                start: `${rawValue}-01`,
                end: formatCalendarDate(date).slice(0, 7) + "-01"
            };
        }
        return {
            start: rawValue,
            end: addCalendarDays(rawValue, 1)
        };
    };
    const decimalParts = (rawValue) => {
        const text = String(rawValue).replace(/^NumberDecimal\("(.*)"\)$/, "$1");
        const match = text.match(
            /^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/
        );
        if (!match) {
            return null;
        }
        const sign = match[1] === "-" ? -1n : 1n;
        let digits = `${match[2]}${match[3] || ""}`.replace(/^0+(?=\d)/, "") || "0";
        let scale = (match[3] || "").length - Number(match[4] || 0);
        if (scale < 0) {
            digits += "0".repeat(-scale);
            scale = 0;
        }
        return { coefficient: sign * BigInt(digits), scale };
    };
    const decimalText = (coefficient, scale) => {
        if (coefficient === 0n) {
            return "0";
        }
        const sign = coefficient < 0n ? "-" : "";
        const digits = (coefficient < 0n ? -coefficient : coefficient)
            .toString()
            .padStart(scale + 1, "0");
        if (scale === 0) {
            return `${sign}${digits}`;
        }
        const integer = digits.slice(0, -scale) || "0";
        const fraction = digits.slice(-scale).replace(/0+$/, "");
        return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`;
    };
    const decimalEqual = (left, right) => {
        const leftParts = decimalParts(left);
        const rightParts = decimalParts(right);
        if (!leftParts || !rightParts) {
            return false;
        }
        const scale = Math.max(leftParts.scale, rightParts.scale);
        return (
            leftParts.coefficient * 10n ** BigInt(scale - leftParts.scale) ===
            rightParts.coefficient * 10n ** BigInt(scale - rightParts.scale)
        );
    };
    const decimalAdd = (left, right) => {
        const leftParts = decimalParts(left);
        const rightParts = decimalParts(right);
        if (!leftParts || !rightParts) {
            return null;
        }
        const scale = Math.max(leftParts.scale, rightParts.scale);
        return decimalText(
            leftParts.coefficient * 10n ** BigInt(scale - leftParts.scale) +
                rightParts.coefficient * 10n ** BigInt(scale - rightParts.scale),
            scale
        );
    };
    const epochSeconds = (rawValue) => {
        const components = rawValue.match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}|60)(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))?$/
        );
        if (!components) {
            return null;
        }
        const date = new Date(0);
        date.setUTCFullYear(
            Number(components[1]),
            Number(components[2]) - 1,
            Number(components[3])
        );
        date.setUTCHours(
            Number(components[4]),
            Number(components[5]),
            Number(components[6]),
            0
        );
        let seconds = String(Math.floor(date.getTime() / 1000));
        const offset =
            components[8] === undefined || components[8] === "Z"
                ? 0
                : (components[9] === "+" ? 1 : -1) *
                  (Number(components[10]) * 3600 + Number(components[11]) * 60);
        seconds = decimalAdd(seconds, String(-offset));
        return components[7] ? decimalAdd(seconds, `0.${components[7]}`) : seconds;
    };
    const inferredPrecision = (rawValue, targetType) => {
        if (/^\d{4}$/.test(rawValue)) {
            return { precision: "year" };
        }
        if (/^\d{4}-\d{2}$/.test(rawValue)) {
            return { precision: "month" };
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
            return { precision: "day" };
        }
        const fraction = rawValue.match(/T\d{2}:\d{2}:\d{2}\.(\d+)/);
        if (fraction) {
            return { precision: "fraction", fractionDigits: fraction[1].length };
        }
        if (/T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/.test(rawValue)) {
            return { precision: "second" };
        }
        if (
            targetType === "dateTime" &&
            /T\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/.test(rawValue)
        ) {
            return { precision: "minute" };
        }
        return null;
    };

    if (type === "date") {
        if (
            typeof value.value !== "string" ||
            !datePattern.test(value.value) ||
            !["year", "month", "day"].includes(value.precision) ||
            typeof value.normalizedStart !== "string" ||
            typeof value.normalizedEnd !== "string" ||
            !isCalendarDate(value.normalizedStart) ||
            !isCalendarDate(value.normalizedEnd)
        ) {
            return false;
        }
        const inferred = inferredPrecision(value.value, type);
        if (!inferred || inferred.precision !== value.precision) {
            return false;
        }
        const expected = dateBoundaries(value.value, value.precision);
        return (
            value.normalizedStart === expected.start &&
            value.normalizedEnd === expected.end &&
            value.normalizedStart < value.normalizedEnd
        );
    }

    const pattern = type === "dateTime" ? dateTimePattern : instantPattern;
    if (typeof value.value !== "string" || !pattern.test(value.value)) {
        return false;
    }
    const inferred = inferredPrecision(value.value, type);
    const allowedPrecisions =
        type === "dateTime"
            ? ["year", "month", "day", "minute", "second", "fraction"]
            : ["second", "fraction"];
    if (
        !inferred ||
        !allowedPrecisions.includes(value.precision) ||
        inferred.precision !== value.precision
    ) {
        return false;
    }
    if (value.precision === "fraction") {
        if (value.fractionDigits !== inferred.fractionDigits) {
            return false;
        }
    } else if (Object.prototype.hasOwnProperty.call(value, "fractionDigits")) {
        return false;
    }

    let expectedStart;
    let expectedEnd;
    if (type === "dateTime" && ["year", "month", "day"].includes(value.precision)) {
        const calendar = dateBoundaries(
            value.value,
            value.precision === "year" ? "year" : value.precision
        );
        expectedStart = epochSeconds(`${calendar.start}T00:00:00Z`);
        expectedEnd = epochSeconds(`${calendar.end}T00:00:00Z`);
    } else {
        expectedStart = epochSeconds(value.value);
        if (!expectedStart) {
            return false;
        }
        const increment =
            value.precision === "minute"
                ? "60"
                : value.precision === "second"
                  ? "1"
                  : `0.${"0".repeat(value.fractionDigits - 1)}1`;
        expectedEnd = decimalAdd(expectedStart, increment);
    }
    if (type === "instant") {
        return decimalEqual(
            value.epochSeconds && value.epochSeconds.toString(),
            expectedStart
        );
    }
    return (
        decimalEqual(
            value.normalizedStart && value.normalizedStart.toString(),
            expectedStart
        ) &&
        decimalEqual(value.normalizedEnd && value.normalizedEnd.toString(), expectedEnd)
    );
}

module.exports = {
    canonicalTemporalValueMatches
};
