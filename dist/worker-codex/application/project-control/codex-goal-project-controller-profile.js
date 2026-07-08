import { join } from "node:path";
import { LocalControlledAgentStateStore, } from "@vioxen/subscription-runtime/store-local-file";
import { buildLocalClaudeControlledAgentProfile, } from "@vioxen/subscription-runtime/worker-local";
import { AccessBoundary, NetworkAccessMode, RunEventProviderKind, buildControlledAgentLaunchPlan, } from "@vioxen/subscription-runtime/worker-core";
import { buildCodexControlledAgentProfile, } from "../../controlled-agent/index.js";
import { resolvePath } from "../codex-goal-input-values.js";
import { projectControllerProviderKind, } from "./codex-goal-project-controller-options.js";
export function projectControllerState(options, controller) {
    const stateDir = resolvePath(options.cwd, options.stateDir ?? join(controller.controller.jobRootDir, "controlled-agent"));
    return {
        cwd: options.cwd,
        stateDir,
        sessionId: projectControllerSessionId(controller.controller.jobId, projectControllerProviderKind(options)),
        store: new LocalControlledAgentStateStore({ rootDir: stateDir }),
    };
}
function projectControllerSessionId(controllerJobId, providerKind) {
    if (providerKind === RunEventProviderKind.Codex) {
        return controllerJobId + ":controlled-agent";
    }
    return controllerJobId + ":controlled-agent:" + providerKind;
}
export function projectControllerProfile(options, state) {
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
export function projectControllerLaunchInput(controller, state, profile) {
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
export function projectControllerAllowedTools(profile) {
    return profile.providerKind === RunEventProviderKind.Codex
        ? profile.enabledTools
        : profile.allowedTools;
}
export function projectControllerProfileReadyJson(profile) {
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
//# sourceMappingURL=codex-goal-project-controller-profile.js.map