/// <reference types="node" />
import { type ControlledAgentProcessOwner, type ControlledAgentProviderPort } from "@vioxen/subscription-runtime/worker-core";
export type ProjectControllerProviderRegistry = {
    readonly get: (sessionId: string) => ControlledAgentProviderPort | undefined;
    readonly set: (sessionId: string, provider: ControlledAgentProviderPort) => void;
    readonly delete: (sessionId: string) => void;
};
export declare function createInMemoryProjectControllerProviderRegistry(): ProjectControllerProviderRegistry;
export declare function projectControllerProcessOwner(runtimeVersion: string): ControlledAgentProcessOwner;
export declare function projectControllerOwnerIsLive(owner: ControlledAgentProcessOwner): boolean;
//# sourceMappingURL=codex-goal-project-controller-runtime.d.ts.map