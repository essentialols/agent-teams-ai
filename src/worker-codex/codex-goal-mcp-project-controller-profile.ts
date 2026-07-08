import type { ProjectControllerLaunchPlanMcpArgs } from "./codex-goal-mcp-inputs";
import { resolvePath, stringValue } from "./codex-goal-mcp-values";
import { stringArrayArg } from "./codex-goal-mcp-project-utils";
import type {
  ProjectControllerOptions,
} from "./application/project-control/codex-goal-project-controller-options";

export function projectControllerOptionsFromMcpArgs(
  args: ProjectControllerLaunchPlanMcpArgs,
): ProjectControllerOptions {
  const cwd = resolvePath(process.cwd(), stringValue(args.cwd) ?? process.cwd());
  return {
    cwd,
    ...(stringValue(args.providerKind) === undefined
      ? {}
      : { providerKind: stringValue(args.providerKind) as string }),
    ...(stringValue(args.stateDir) === undefined
      ? {}
      : { stateDir: stringValue(args.stateDir) as string }),
    ...(stringValue(args.sessionArtifactPath) === undefined
      ? {}
      : { sessionArtifactPath: stringValue(args.sessionArtifactPath) as string }),
    ...(stringValue(args.claudePath) === undefined
      ? {}
      : { claudePath: stringValue(args.claudePath) as string }),
    ...(stringValue(args.mcpServerName) === undefined
      ? {}
      : { mcpServerName: stringValue(args.mcpServerName) as string }),
    ...(stringValue(args.mcpCommand) === undefined
      ? {}
      : { mcpCommand: stringValue(args.mcpCommand) as string }),
    ...(args.mcpArgs === undefined ? {} : { mcpArgs: stringArrayArg(args.mcpArgs) }),
    ...(stringValue(args.mcpCwd) === undefined
      ? {}
      : { mcpCwd: stringValue(args.mcpCwd) as string }),
    ...(args.rawShellMode === undefined ? {} : { rawShellMode: args.rawShellMode }),
    ...(args.maxGoalTurns === undefined ? {} : { maxGoalTurns: args.maxGoalTurns }),
    ...(stringValue(args.reason) === undefined
      ? {}
      : { reason: stringValue(args.reason) as string }),
    ...(stringValue(args.deliveryAttemptId) === undefined
      ? {}
      : { deliveryAttemptId: stringValue(args.deliveryAttemptId) as string }),
  };
}
