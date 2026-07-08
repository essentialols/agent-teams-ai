/// <reference types="node" />
import { LocalControlledAgentStateStore } from "@vioxen/subscription-runtime/store-local-file";
import { buildLocalClaudeControlledAgentProfile } from "@vioxen/subscription-runtime/worker-local";
import { type ProjectAccessScope } from "@vioxen/subscription-runtime/worker-core";
import { buildCodexControlledAgentProfile } from "../../controlled-agent/index.js";
import type { CodexGoalJobManifest } from "../../codex-goal-jobs.js";
import { type ProjectControllerOptions } from "./codex-goal-project-controller-options.js";
type JsonObject = Readonly<Record<string, unknown>>;
export type ProjectControllerProfile = ReturnType<typeof buildCodexControlledAgentProfile> | ReturnType<typeof buildLocalClaudeControlledAgentProfile>;
export declare function projectControllerState(options: ProjectControllerOptions, controller: {
    readonly controller: CodexGoalJobManifest;
}): {
    readonly stateDir: string;
    readonly cwd: string;
    readonly sessionId: string;
    readonly store: LocalControlledAgentStateStore;
};
export declare function projectControllerProfile(options: ProjectControllerOptions, state: {
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
//# sourceMappingURL=codex-goal-project-controller-profile.d.ts.map