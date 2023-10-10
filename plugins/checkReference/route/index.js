const router = require("express").Router();
const { checkReferenceMiddleware } = require("../middleware/checkReference");

// create API
router.post(
    `/${process.env.FHIRSERVER_APIPATH}/:resourceType`,
    checkReferenceMiddleware
);

// update API
router.put(
    `/${process.env.FHIRSERVER_APIPATH}/:resourceType/:id`,
    checkReferenceMiddleware
);

module.exports = router;
