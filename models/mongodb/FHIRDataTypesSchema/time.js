module.exports = {
    type: Number,
    default: void 0,
    set: function (v) {
        if (v == null || v === "") {
            return;
        }

        const match = /^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(String(v));
        if (!match) {
            return;
        }

        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        const seconds = Number(match[3]);
        const milliseconds = Number((match[4] || "0").padEnd(3, "0"));
        if (hours > 23 || minutes > 59 || seconds > 59) {
            return;
        }

        return (
            hours * 3600000 +
            minutes * 60000 +
            seconds * 1000 +
            milliseconds
        );
    },
    get: function (v) {
        if (v == null) {
            return;
        }

        const hours = Math.floor(v / 3600000);
        const remainder = v - hours * 3600000;
        const minutes = Math.floor(remainder / 60000);
        const remainderSeconds = remainder - minutes * 60000;
        const seconds = Math.floor(remainderSeconds / 1000);
        const milliseconds = remainderSeconds - seconds * 1000;
        if (milliseconds > 0) {
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
                2,
                "0"
            )}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(2, "0")}`;
    }
};
