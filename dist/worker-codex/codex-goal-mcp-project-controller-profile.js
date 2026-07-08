import { resolvePath, stringValue } from "./codex-goal-mcp-values.js";
import { stringArrayArg } from "./codex-goal-mcp-project-utils.js";
export function projectControllerOptionsFromMcpArgs(args) {
    const cwd = resolvePath(process.cwd(), stringValue(args.cwd) ?? process.cwd());
    return {
        cwd,
        ...(stringValue(args.providerKind) === undefined
            ? {}
            : { providerKind: stringValue(args.providerKind) }),
        ...(stringValue(args.stateDir) === undefined
            ? {}
            : { stateDir: stringValue(args.stateDir) }),
        ...(stringValue(args.sessionArtifactPath) === undefined
            ? {}
            : { sessionArtifactPath: stringValue(args.sessionArtifactPath) }),
        ...(stringValue(args.claudePath) === undefined
            ? {}
            : { claudePath: stringValue(args.claudePath) }),
        ...(stringValue(args.mcpServerName) === undefined
            ? {}
            : { mcpServerName: stringValue(args.mcpServerName) }),
        ...(stringValue(args.mcpCommand) === undefined
            ? {}
            : { mcpCommand: stringValue(args.mcpCommand) }),
        ...(args.mcpArgs === undefined ? {} : { mcpArgs: stringArrayArg(args.mcpArgs) }),
        ...(stringValue(args.mcpCwd) === undefined
            ? {}
            : { mcpCwd: stringValue(args.mcpCwd) }),
        ...(args.rawShellMode === undefined ? {} : { rawShellMode: args.rawShellMode }),
        ...(args.maxGoalTurns === undefined ? {} : { maxGoalTurns: args.maxGoalTurns }),
        ...(stringValue(args.reason) === undefined
            ? {}
            : { reason: stringValue(args.reason) }),
        ...(stringValue(args.deliveryAttemptId) === undefined
            ? {}
            : { deliveryAttemptId: stringValue(args.deliveryAttemptId) }),
    };
}
//# sourceMappingURL=codex-goal-mcp-project-controller-profile.js.map