const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const globals = require("globals");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

module.exports = defineConfig([
    {
        ignores: [
            "**/node_modules/**",
            ".vscode/**",
            "**/.env",
            "temp/**",
            "public/**",
            "models/FHIR/fhir/**",
            "docs/**",
            "FHIR-mongoose-Models-Generator/resourceGenerator-New.js",
            "models/mongodb/FHIRDataTypesSchema-New/**",
            "config/config.js",
            "plugins/config.js",
            "docs/apidoc/apidoc-sources/**",
            "log/**",
            "pm2log/**",
            "utils/validator/igs/**",
            "evidence/**",
            "fumadocs/**",
            "**/.next/**"
        ]
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.mocha,
                BigInt: "readonly"
            }
        },
        rules: {
            semi: ["error", "always"],
            "comma-dangle": ["error", "never"],
            "no-unused-vars": "off",
            "no-console": "off",
            "no-useless-escape": "off",
            "no-useless-catch": "off"
        }
    },
    eslintConfigPrettier
]);
