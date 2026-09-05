require("module-alias/register");
require("dotenv").config();

const {
    parseMongoProvisioningArgs,
    resolveVerifyExitCode,
    USAGE
} = require("./lib/mongodb-provisioning-cli");
const { runMongoVerifyCommand } = require("@models/mongodb/provisioning/operationalCommands");

async function main() {
    const parsed = parseMongoProvisioningArgs(process.argv.slice(2));
    if (parsed.error) {
        console.error(parsed.error);
        console.error(USAGE);
        process.exitCode = resolveVerifyExitCode({ error: parsed.error });
        return;
    }
    if (parsed.help) {
        console.log(USAGE);
        process.exitCode = 0;
        return;
    }

    const { exitCode, report } = await runMongoVerifyCommand();
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = resolveVerifyExitCode({ exitCode });
}

main().catch((error) => {
    console.error(error);
    process.exit(resolveVerifyExitCode({ exitCode: 2 }));
});
