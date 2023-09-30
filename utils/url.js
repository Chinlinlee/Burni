const path = require("path");
const _ = require("lodash");
const { URL } = require("url");

function urlJoin(subPath, baseUrl) {
    let baseUrlSplit = _.compact(baseUrl.split("/"));
    if (baseUrlSplit.length > 2) {
        let subPathInBaseUrl = baseUrlSplit.slice(2).join("/");
        let newSubPath = path.join(subPathInBaseUrl, subPath);
        let joinURL = new URL(newSubPath, baseUrl);
        return joinURL.href;
    } else {
        let joinURL = new URL(subPath, baseUrl);
        return joinURL.href;
    }
}

module.exports.urlJoin = urlJoin;
