/// <reference types="node" />
import { type ControlledAgentEventPort, type ControlledAgentProviderPort, type ControlledAgentProviderStatusResult, type ControllerStateStorePort, type GetControlledAgentStatusResult, type ProjectAccessScope, type ReconcileControlledAgentRunResult, type StartControlledAgentRunResult, type StopControlledAgentRunResult } from "@vioxen/subscription-runtime/worker-core";
import type { CodexGoalLaunchInput } from "../../codex-goal-ops.js";
import type { ProjectControllerProfile } from "./codex-goal-project-controller-profile.js";
import { projectControllerProcessOwner, type ProjectControllerProviderRegistry } from "./codex-goal-project-controller-runtime.js";
type JsonObject = Readonly<Record<string, unknown>>;
export type ProjectControllerRunState = {
    readonly stateDir: string;
    readonly sessionId: string;
    readonly store: ControllerStateStorePort & ControlledAgentEventPort;
};
export type ProjectControllerRunDeps = {
    readonly runtimeVersion: string;
    readonly providerRegistry: ProjectControllerProviderRegistry;
};
export type ProjectControllerProviderStartInput = {
    readonly provider: ControlledAgentProviderPort;
    readonly account?: JsonObject;
    readonly sessionArtifact?: JsonObject;
    readonly safeMessage: string;
};
export declare function startProjectControllerControlledRun(input: {
    readonly controllerJobId: string;
    readonly scope: ProjectAccessScope;
    readonly profile: ProjectControllerProfile;
    readonly state: ProjectControllerRunState;
    readonly launch: CodexGoalLaunchInput;
    readonly providerInput: ProjectControllerProviderStartInput;
    readonly deps: ProjectControllerRunDeps;
}): Promise<{
    readonly result: StartControlledAgentRunResult;
    readonly owner: ReturnType<typeof projectControllerProcessOwner>;
    readonly providerEvidence: {
        readonly account?: JsonObject;
        readonly sessionArtifact?: JsonObject;
        readonly safeMessage: string;
    };
}>;
export declare function observeProjectControllerControlledRun(input: {
    readonly state: ProjectControllerRunState;
    readonly deps: ProjectControllerRunDeps;
}): Promise<{
    readonly result: GetControlledAgentStatusResult;
    readonly providerAttached: boolean;
    readonly observed?: ControlledAgentProviderStatusResult;
    readonly providerStatusError?: string;
    readonly owner: ReturnType<typeof projectControllerProcessOwner>;
}>;
export declare function stopProjectControllerControlledRun(input: {
    readonly state: ProjectControllerRunState;
    readonly reason: string;
    readonly deps: ProjectControllerRunDeps;
}): Promise<{
    readonly statusResult: Extract<GetControlledAgentStatusResult, {
        readonly ok: true;
    }>;
    readonly stopped: StopControlledAgentRunResult;
    readonly owner: ReturnType<typeof projectControllerProcessOwner>;
} | {
    readonly result: GetControlledAgentStatusResult;
    readonly owner: ReturnType<typeof projectControllerProcessOwner>;
    readonly stopped?: undefined;
}>;
export declare function reconcileProjectControllerControlledRun(input: {
    readonly controllerJobId: string;
    readonly state: ProjectControllerRunState;
    readonly loadLaunch: () => Promise<CodexGoalLaunchInput>;
    readonly deps: ProjectControllerRunDeps;
}): Promise<{
    readonly result: GetControlledAgentStatusResult;
    readonly owner: ReturnType<typeof projectControllerProcessOwner>;
    readonly reconciled?: ReconcileControlledAgentRunResult;
}>;
export {};
//# sourceMappingURL=codex-goal-project-controller-run-use-cases.d.ts.map