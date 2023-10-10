const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const tokenAuthPluginConfig =
    require("../../../../config").pluginsConfig.tokenAuth;

(() => {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (id, done) {
        done(null, id);
    });

    passport.use(
        "admin-login",
        new LocalStrategy(
            {
                usernameField: "username",
                passwordField: "password",
                session: true,
                passReqToCallback: true
            },
            function (req, username, password, done) {
                if (
                    username === tokenAuthPluginConfig.admin.username &&
                    password === tokenAuthPluginConfig.admin.password
                ) {
                    return done(null, username);
                }
                return done(null, false, "Invalid user or password");
            }
        )
    );
})();
