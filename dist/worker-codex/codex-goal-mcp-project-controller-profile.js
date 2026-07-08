import { join } from "node:path";
import { LocalControlledAgentStateStore, } from "@vioxen/subscription-runtime/store-local-file";
import { buildLocalClaudeControlledAgentProfile, } from "@vioxen/subscription-runtime/worker-local";
import { AccessBoundary, NetworkAccessMode, RunEventProviderKind, buildControlledAgentLaunchPlan, } from "@vioxen/subscription-runtime/worker-core";
import { buildCodexControlledAgentProfile, } from "./controlled-agent/index.js";
import { optionalRunEventProviderKind, } from "./codex-goal-mcp-inputs.js";
import { resolvePath, stringValue } from "./codex-goal-mcp-values.js";
import { stringArrayArg } from "./codex-goal-mcp-project-utils.js";
export function projectControllerState(args, controller) {
    const cwd = resolvePath(process.cwd(), stringValue(args.cwd) ?? process.cwd());
    const stateDir = resolvePath(cwd, stringValue(args.stateDir) ??
        join(controller.controller.jobRootDir, "controlled-agent"));
    return {
        cwd,
        stateDir,
        sessionId: projectControllerSessionId(controller.controller.jobId, projectControllerProviderKind(args)),
        store: new LocalControlledAgentStateStore({ rootDir: stateDir }),
    };
}
export function projectControllerProviderKind(args) {
    const providerKind = optionalRunEventProviderKind(args.providerKind) ??
        RunEventProviderKind.Codex;
    if (providerKind === RunEventProviderKind.Codex ||
        providerKind === RunEventProviderKind.Claude) {
        return providerKind;
    }
    throw new Error(`project_controller_provider_kind_unsupported:${providerKind}`);
}
function projectControllerSessionId(controllerJobId, providerKind) {
    if (providerKind === RunEventProviderKind.Codex) {
        return `${controllerJobId}:controlled-agent`;
    }
    return `${controllerJobId}:controlled-agent:${providerKind}`;
}
export function projectControllerProfile(args, state) {
    const common = {
        stateDir: state.stateDir,
        ...(stringValue(args.mcpServerName) === undefined
            ? {}
            : { mcpServerName: stringValue(args.mcpServerName) }),
        ...(stringValue(args.mcpCommand) === undefined
            ? {}
            : { mcpCommand: stringValue(args.mcpCommand) }),
        ...(args.mcpArgs === undefined ? {} : { mcpArgs: stringArrayArg(args.mcpArgs) }),
        ...(stringValue(args.mcpCwd) === undefined
            ? {}
            : { mcpCwd: resolvePath(state.cwd, stringValue(args.mcpCwd)) }),
    };
    if (projectControllerProviderKind(args) === RunEventProviderKind.Claude) {
        return buildLocalClaudeControlledAgentProfile(common);
    }
    return buildCodexControlledAgentProfile({
        ...common,
        rawShellMode: args.rawShellMode ?? "disabled-by-provider",
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
//# sourceMappingURL=codex-goal-mcp-project-controller-profile.js.map