const TEMPORAL_CHOICE_SUFFIXES = [
    { suffix: "DateTime", type: "dateTime" },
    { suffix: "Date", type: "date" },
    { suffix: "Instant", type: "instant" },
    { suffix: "Time", type: "time" }
];

function fixChoiceTypeOfDate(fieldName, type) {
    if (fieldName === "modifierExtension" || type !== "string") {
        return {
            yes: false,
            type: ""
        };
    }

    for (const { suffix, type: temporalType } of TEMPORAL_CHOICE_SUFFIXES) {
        if (fieldName.endsWith(suffix)) {
            return {
                yes: true,
                type: temporalType
            };
        }
    }

    return {
        yes: false,
        type: ""
    };
}

module.exports = {
    fixChoiceTypeOfDate
};
