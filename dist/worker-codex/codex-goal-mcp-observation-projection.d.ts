/// <reference types="node" />
import { type RunEventProviderKind, type RunObservationSnapshot } from "@vioxen/subscription-runtime/worker-core";
import type { AgentRunWatchMcpArgs } from "./codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
export declare function observeOrphanCodexRun(input: {
    readonly runId: string;
    readonly error: unknown;
    readonly args: AgentRunWatchMcpArgs;
    readonly providerKind: RunEventProviderKind;
    readonly staleAfterMs: number;
    readonly tailLines: number;
}): Promise<RunObservationSnapshot | null>;
export declare function failedRunObservationSnapshot(input: {
    readonly runId: string;
    readonly providerKind: RunEventProviderKind;
    readonly error: unknown;
}): RunObservationSnapshot;
export declare function safeObservationErrorMessage(error: unknown): string;
export declare function summarizeRunObservationSnapshots(snapshots: readonly {
    readonly status: string;
    readonly liveness: string;
    readonly readOnlyDecision: {
        readonly kind: string;
    };
    readonly warnings: readonly unknown[];
}[]): JsonObject;
export {};
//# sourceMappingURL=codex-goal-mcp-observation-projection.d.ts.map