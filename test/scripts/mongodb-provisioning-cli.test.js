require("module-alias/register");

const { expect } = require("chai");
const {
    EXIT_SUCCESS,
    EXIT_PROVISION_FAILED,
    EXIT_VERIFY_FAILED,
    EXIT_AUDIT_NOT_AVAILABLE,
    EXIT_USAGE,
    parseMongoProvisioningArgs,
    resolveProvisionExitCode,
    resolveVerifyExitCode,
    resolveAuditExitCode
} = require("../../scripts/lib/mongodb-provisioning-cli");

describe("mongodb provisioning CLI", function () {
    it("parses --help without error", function () {
        const parsed = parseMongoProvisioningArgs(["--help"]);
        expect(parsed.help).to.equal(true);
        expect(parsed.error).to.be.undefined;
    });

    it("rejects unknown arguments", function () {
        const parsed = parseMongoProvisioningArgs(["--unknown"]);
        expect(parsed.error).to.match(/Unknown argument/);
    });

    it("maps provision success and failure exit codes", function () {
        expect(resolveProvisionExitCode({ exitCode: EXIT_SUCCESS })).to.equal(EXIT_SUCCESS);
        expect(resolveProvisionExitCode({ exitCode: EXIT_PROVISION_FAILED })).to.equal(
            EXIT_PROVISION_FAILED
        );
        expect(resolveProvisionExitCode({ error: "usage" })).to.equal(EXIT_USAGE);
    });

    it("maps verify and audit exit codes", function () {
        expect(resolveVerifyExitCode({ exitCode: EXIT_SUCCESS })).to.equal(EXIT_SUCCESS);
        expect(resolveVerifyExitCode({ exitCode: EXIT_VERIFY_FAILED })).to.equal(
            EXIT_VERIFY_FAILED
        );
        expect(resolveAuditExitCode({ exitCode: EXIT_AUDIT_NOT_AVAILABLE })).to.equal(
            EXIT_AUDIT_NOT_AVAILABLE
        );
    });
});
