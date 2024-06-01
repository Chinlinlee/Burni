module.exports.pluginsConfig = {
    tokenAuth: {
        enable: true,
        before: true,
        routers: [
            {
                method: "get",
                path: "/fhir/:resourceType"
            }
        ],
        admin: {
            loginPath: process.env.ADMIN_LOGIN_PATH,
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD
        },
        jwt: {
            secretKey: process.env.SERVER_SESSION_SECRET_KEY
        }
    },
    checkReference: {
        enable: true,
        before: true
    }
};
