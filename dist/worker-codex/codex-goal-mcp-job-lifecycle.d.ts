/// <reference types="node" />
import type { CodexGoalJobManifest } from "./codex-goal-jobs.js";
import { type CodexGoalLaunchInput } from "./codex-goal-ops.js";
import { type JobIdMcpArgs, type JobLifecycleMcpArgs, type JobResultReconcileMcpArgs } from "./codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
type LoadedCodexGoalJobLaunch = {
    readonly registryRootDir: string;
    readonly manifest: CodexGoalJobManifest;
    readonly launch: CodexGoalLaunchInput;
};
export type CodexGoalMcpJobLifecycleDeps = {
    readonly loadJobLaunch: (args: JobIdMcpArgs) => Promise<LoadedCodexGoalJobLaunch>;
};
export declare function continueStoredJobLifecycle(args: JobLifecycleMcpArgs, options: {
    readonly mode: "continue" | "recover";
    readonly confirmKey: "confirmContinue" | "confirmRecover";
}, deps: CodexGoalMcpJobLifecycleDeps): Promise<JsonObject>;
export declare function reconcileStoredJobRuntimeResultLifecycle(args: JobResultReconcileMcpArgs, deps: CodexGoalMcpJobLifecycleDeps): Promise<JsonObject>;
export declare function stopStoredJobLifecycle(args: JobLifecycleMcpArgs, deps: CodexGoalMcpJobLifecycleDeps): Promise<JsonObject>;
export declare function maintenancePauseStoredJobLifecycle(args: JobLifecycleMcpArgs, deps: CodexGoalMcpJobLifecycleDeps): Promise<JsonObject>;
export {};
//# sourceMappingURL=codex-goal-mcp-job-lifecycle.d.ts.map