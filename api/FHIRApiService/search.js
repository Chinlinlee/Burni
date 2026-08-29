const { SearchService } = require("./services/search.service");

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} resourceType
 * @returns
 */
module.exports = async function (req, res, resourceType) {
    const searchService = new SearchService(req, res, resourceType);

    const { status, code, result } = await searchService.search();

    return searchService.doResponse(code, result);
};
