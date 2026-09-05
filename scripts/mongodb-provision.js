require("module-alias/register");
require("dotenv").config();

const {
    parseMongoProvisioningArgs,
    resolveProvisionExitCode,
    USAGE
} = require("./lib/mongodb-provisioning-cli");
const { runMongoProvisionCommand } = require("@models/mongodb/provisioning/operationalCommands");

async function main() {
    const parsed = parseMongoProvisioningArgs(process.argv.slice(2));
    if (parsed.error) {
        console.error(parsed.error);
        console.error(USAGE);
        process.exitCode = resolveProvisionExitCode({ error: parsed.error });
        return;
    }
    if (parsed.help) {
        console.log(USAGE);
        process.exitCode = 0;
        return;
    }

    const { exitCode, report } = await runMongoProvisionCommand();
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = resolveProvisionExitCode({ exitCode });
}

main().catch((error) => {
    console.error(error);
    process.exit(resolveProvisionExitCode({ exitCode: 1 }));
});
