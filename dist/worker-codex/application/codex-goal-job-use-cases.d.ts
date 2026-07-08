/// <reference types="node" />
import { type JobBriefMcpArgs, type JobCreateMcpArgs, type JobDecisionMcpArgs, type JobHandoffMcpArgs, type JobIdMcpArgs, type JobLifecycleMcpArgs, type JobOverviewMcpArgs, type JobRegistryMcpArgs, type JobResultReconcileMcpArgs, type JobUpdateMcpArgs, type JobWatchMcpArgs } from "../codex-goal-mcp-inputs.js";
type JsonObject = Readonly<Record<string, unknown>>;
export declare function listCodexGoalJobsUseCase(args: JobRegistryMcpArgs): Promise<JsonObject>;
export declare function buildCodexGoalOverviewUseCase(args: JobOverviewMcpArgs): Promise<JsonObject>;
export declare function reconcilePreviewCodexGoalJobsUseCase(args: JobWatchMcpArgs): Promise<JsonObject>;
export declare function getCodexGoalJobUseCase(args: JobIdMcpArgs): Promise<JsonObject>;
export declare function createCodexGoalJobUseCase(args: JobCreateMcpArgs): Promise<JsonObject>;
export declare function updateCodexGoalJobUseCase(args: JobUpdateMcpArgs): Promise<JsonObject>;
export declare function getCodexGoalStatusByIdUseCase(args: JobIdMcpArgs): Promise<JsonObject>;
export declare function recommendCodexGoalNextActionUseCase(args: JobIdMcpArgs): Promise<JsonObject>;
export declare function assertSingleCodexWriterUseCase(args: JobIdMcpArgs & Readonly<Record<string, unknown>>): Promise<JsonObject>;
export declare function reconcileStoredJobRuntimeResultUseCase(args: JobResultReconcileMcpArgs): Promise<JsonObject>;
export declare function continueStoredJobUseCase(args: JobLifecycleMcpArgs, options: {
    readonly mode: "continue" | "recover";
    readonly confirmKey: "confirmContinue" | "confirmRecover";
}): Promise<JsonObject>;
export declare function stopStoredJobUseCase(args: JobLifecycleMcpArgs): Promise<JsonObject>;
export declare function maintenancePauseStoredJobUseCase(args: JobLifecycleMcpArgs): Promise<JsonObject>;
export declare function markCodexGoalReviewedUseCase(args: JobIdMcpArgs & Readonly<{
    note?: unknown;
}>): Promise<JsonObject>;
export declare function buildCodexGoalBriefUseCase(args: JobBriefMcpArgs): Promise<JsonObject>;
export declare function buildCodexGoalDecisionUseCase(args: JobDecisionMcpArgs): Promise<JsonObject>;
export declare function buildCodexGoalHandoffUseCase(args: JobHandoffMcpArgs): Promise<JsonObject>;
export {};
//# sourceMappingURL=codex-goal-job-use-cases.d.ts.map