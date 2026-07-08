import { join } from "node:path";
import {
  LocalControlledAgentStateStore,
} from "@vioxen/subscription-runtime/store-local-file";
import {
  buildLocalClaudeControlledAgentProfile,
} from "@vioxen/subscription-runtime/worker-local";
import {
  AccessBoundary,
  NetworkAccessMode,
  RunEventProviderKind,
  buildControlledAgentLaunchPlan,
  type ProjectAccessScope,
} from "@vioxen/subscription-runtime/worker-core";
import {
  buildCodexControlledAgentProfile,
} from "./controlled-agent";
import type { CodexGoalJobManifest } from "./codex-goal-jobs";
import {
  optionalRunEventProviderKind,
  type ProjectControllerLaunchPlanMcpArgs,
} from "./codex-goal-mcp-inputs";
import { resolvePath, stringValue } from "./codex-goal-mcp-values";
import { stringArrayArg } from "./codex-goal-mcp-project-utils";

type JsonObject = Readonly<Record<string, unknown>>;

export type ProjectControllerProviderKind =
  | RunEventProviderKind.Codex
  | RunEventProviderKind.Claude;

export type ProjectControllerProfile =
  | ReturnType<typeof buildCodexControlledAgentProfile>
  | ReturnType<typeof buildLocalClaudeControlledAgentProfile>;

export function projectControllerState(
  args: ProjectControllerLaunchPlanMcpArgs,
  controller: {
    readonly controller: CodexGoalJobManifest;
  },
): {
  readonly stateDir: string;
  readonly cwd: string;
  readonly sessionId: string;
  readonly store: LocalControlledAgentStateStore;
} {
  const cwd = resolvePath(process.cwd(), stringValue(args.cwd) ?? process.cwd());
  const stateDir = resolvePath(
    cwd,
    stringValue(args.stateDir) ??
      join(controller.controller.jobRootDir, "controlled-agent"),
  );
  return {
    cwd,
    stateDir,
    sessionId: projectControllerSessionId(
      controller.controller.jobId,
      projectControllerProviderKind(args),
    ),
    store: new LocalControlledAgentStateStore({ rootDir: stateDir }),
  };
}

export function projectControllerProviderKind(
  args: ProjectControllerLaunchPlanMcpArgs,
): ProjectControllerProviderKind {
  const providerKind = optionalRunEventProviderKind(args.providerKind) ??
    RunEventProviderKind.Codex;
  if (
    providerKind === RunEventProviderKind.Codex ||
    providerKind === RunEventProviderKind.Claude
  ) {
    return providerKind;
  }
  throw new Error(`project_controller_provider_kind_unsupported:${providerKind}`);
}

function projectControllerSessionId(
  controllerJobId: string,
  providerKind: ProjectControllerProviderKind,
): string {
  if (providerKind === RunEventProviderKind.Codex) {
    return `${controllerJobId}:controlled-agent`;
  }
  return `${controllerJobId}:controlled-agent:${providerKind}`;
}

export function projectControllerProfile(
  args: ProjectControllerLaunchPlanMcpArgs,
  state: {
    readonly stateDir: string;
    readonly cwd: string;
  },
): ProjectControllerProfile {
  const common = {
    stateDir: state.stateDir,
    ...(stringValue(args.mcpServerName) === undefined
      ? {}
      : { mcpServerName: stringValue(args.mcpServerName) as string }),
    ...(stringValue(args.mcpCommand) === undefined
      ? {}
      : { mcpCommand: stringValue(args.mcpCommand) as string }),
    ...(args.mcpArgs === undefined ? {} : { mcpArgs: stringArrayArg(args.mcpArgs) }),
    ...(stringValue(args.mcpCwd) === undefined
      ? {}
      : { mcpCwd: resolvePath(state.cwd, stringValue(args.mcpCwd) as string) }),
  };
  if (projectControllerProviderKind(args) === RunEventProviderKind.Claude) {
    return buildLocalClaudeControlledAgentProfile(common);
  }
  return buildCodexControlledAgentProfile({
    ...common,
    rawShellMode: args.rawShellMode ?? "disabled-by-provider",
  });
}

export function projectControllerLaunchInput(
  controller: {
    readonly controller: CodexGoalJobManifest;
    readonly scope: ProjectAccessScope;
  },
  state: {
    readonly sessionId: string;
    readonly stateDir: string;
  },
  profile: ProjectControllerProfile,
) {
  return buildControlledAgentLaunchPlan({
    controllerJobId: controller.controller.jobId,
    sessionId: state.sessionId,
    stateDir: state.stateDir,
    boundary: AccessBoundary.ProjectScopedControl,
    projectAccessScope: controller.scope,
    provider: profile.enforcement,
    networkAccess: NetworkAccessMode.Restricted,
  });
}

export function projectControllerAllowedTools(
  profile: ProjectControllerProfile,
): readonly string[] {
  return profile.providerKind === RunEventProviderKind.Codex
    ? profile.enabledTools
    : profile.allowedTools;
}

export function projectControllerProfileReadyJson(
  profile: ProjectControllerProfile,
): JsonObject {
  if (profile.providerKind === RunEventProviderKind.Codex) {
    return {
      allowedTools: profile.enabledTools,
      codexHome: profile.codexHome,
      configToml: profile.configToml,
      rulesText: profile.rulesText,
    };
  }
  return {
    allowedTools: profile.allowedTools,
    disallowedTools: profile.disallowedTools,
    configDir: profile.configDir,
    mcpConfig: profile.mcpConfig,
    strictMcpConfig: profile.strictMcpConfig,
    appendSystemPrompt: profile.appendSystemPrompt,
  };
}
