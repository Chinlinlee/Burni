require("module-alias/register");
require("dotenv").config();

const {
    parseMongoProvisioningArgs,
    resolveAuditExitCode,
    USAGE
} = require("./lib/mongodb-provisioning-cli");
const { runMongoAuditIdCommand } = require("@models/mongodb/provisioning/operationalCommands");

async function main() {
    const parsed = parseMongoProvisioningArgs(process.argv.slice(2));
    if (parsed.error) {
        console.error(parsed.error);
        console.error(USAGE);
        process.exitCode = resolveAuditExitCode({ error: parsed.error });
        return;
    }
    if (parsed.help) {
        console.log(USAGE);
        process.exitCode = 0;
        return;
    }

    const { exitCode, report } = await runMongoAuditIdCommand();
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = resolveAuditExitCode({ exitCode });
}

main().catch((error) => {
    console.error(error);
    process.exit(resolveAuditExitCode({ exitCode: 3 }));
});
