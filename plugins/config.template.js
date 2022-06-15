module.exports.pluginsConfig = {
    token_auth: {
        enable: false,
        before: true,
        routers: [
            {
                method: "get",
                path: "/fhir/:resourceType"
            }
        ],
        admin: {
            loginPath: "",
            username: "",
            password: ""
        },
        jwt: {
            secretKey: ""
        }
    },
    checkReference: {
        enable: true,
        before: true
    }
};