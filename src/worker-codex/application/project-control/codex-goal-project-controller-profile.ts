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
} from "../../controlled-agent";
import type { CodexGoalJobManifest } from "../../codex-goal-jobs";
import { resolvePath } from "../codex-goal-input-values";
import {
  projectControllerProviderKind,
  type ProjectControllerOptions,
} from "./codex-goal-project-controller-options";

type JsonObject = Readonly<Record<string, unknown>>;

export type ProjectControllerProfile =
  | ReturnType<typeof buildCodexControlledAgentProfile>
  | ReturnType<typeof buildLocalClaudeControlledAgentProfile>;

export function projectControllerState(
  options: ProjectControllerOptions,
  controller: {
    readonly controller: CodexGoalJobManifest;
  },
): {
  readonly stateDir: string;
  readonly cwd: string;
  readonly sessionId: string;
  readonly store: LocalControlledAgentStateStore;
} {
  const stateDir = resolvePath(
    options.cwd,
    options.stateDir ?? join(controller.controller.jobRootDir, "controlled-agent"),
  );
  return {
    cwd: options.cwd,
    stateDir,
    sessionId: projectControllerSessionId(
      controller.controller.jobId,
      projectControllerProviderKind(options),
    ),
    store: new LocalControlledAgentStateStore({ rootDir: stateDir }),
  };
}

function projectControllerSessionId(
  controllerJobId: string,
  providerKind: ReturnType<typeof projectControllerProviderKind>,
): string {
  if (providerKind === RunEventProviderKind.Codex) {
    return controllerJobId + ":controlled-agent";
  }
  return controllerJobId + ":controlled-agent:" + providerKind;
}

export function projectControllerProfile(
  options: ProjectControllerOptions,
  state: {
    readonly stateDir: string;
    readonly cwd: string;
  },
): ProjectControllerProfile {
  const common = {
    stateDir: state.stateDir,
    ...(options.mcpServerName === undefined
      ? {}
      : { mcpServerName: options.mcpServerName }),
    ...(options.mcpCommand === undefined
      ? {}
      : { mcpCommand: options.mcpCommand }),
    ...(options.mcpArgs === undefined ? {} : { mcpArgs: options.mcpArgs }),
    ...(options.mcpCwd === undefined
      ? {}
      : { mcpCwd: resolvePath(state.cwd, options.mcpCwd) }),
  };
  if (projectControllerProviderKind(options) === RunEventProviderKind.Claude) {
    return buildLocalClaudeControlledAgentProfile(common);
  }
  return buildCodexControlledAgentProfile({
    ...common,
    rawShellMode: options.rawShellMode ?? "disabled-by-provider",
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
