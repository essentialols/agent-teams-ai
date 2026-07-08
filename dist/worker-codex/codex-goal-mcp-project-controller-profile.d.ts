/// <reference types="node" />
import { LocalControlledAgentStateStore } from "@vioxen/subscription-runtime/store-local-file";
import { buildLocalClaudeControlledAgentProfile } from "@vioxen/subscription-runtime/worker-local";
import { RunEventProviderKind, type ProjectAccessScope } from "@vioxen/subscription-runtime/worker-core";
import { buildCodexControlledAgentProfile } from "./controlled-agent/index.js";
import type { CodexGoalJobManifest } from "./codex-goal-jobs.js";
import { type ProjectControllerLaunchPlanMcpArgs } from "./codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
export type ProjectControllerProviderKind = RunEventProviderKind.Codex | RunEventProviderKind.Claude;
export type ProjectControllerProfile = ReturnType<typeof buildCodexControlledAgentProfile> | ReturnType<typeof buildLocalClaudeControlledAgentProfile>;
export declare function projectControllerState(args: ProjectControllerLaunchPlanMcpArgs, controller: {
    readonly controller: CodexGoalJobManifest;
}): {
    readonly stateDir: string;
    readonly cwd: string;
    readonly sessionId: string;
    readonly store: LocalControlledAgentStateStore;
};
export declare function projectControllerProviderKind(args: ProjectControllerLaunchPlanMcpArgs): ProjectControllerProviderKind;
export declare function projectControllerProfile(args: ProjectControllerLaunchPlanMcpArgs, state: {
    readonly stateDir: string;
    readonly cwd: string;
}): ProjectControllerProfile;
export declare function projectControllerLaunchInput(controller: {
    readonly controller: CodexGoalJobManifest;
    readonly scope: ProjectAccessScope;
}, state: {
    readonly sessionId: string;
    readonly stateDir: string;
}, profile: ProjectControllerProfile): import("@vioxen/subscription-runtime/worker-core").ControlledAgentLaunchPlan;
export declare function projectControllerAllowedTools(profile: ProjectControllerProfile): readonly string[];
export declare function projectControllerProfileReadyJson(profile: ProjectControllerProfile): JsonObject;
export {};
//# sourceMappingURL=codex-goal-mcp-project-controller-profile.d.ts.map