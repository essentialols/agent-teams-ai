import { type AttemptJournal, type SafeExecutionPolicy, type SafeExecutionRunResult, type TaskEffectMode, type WorkerAccountCapacityStore, type WorkerPoolHealth, type WorkerPoolStats, type WorkspaceLockStore } from "@vioxen/subscription-runtime/worker-core";
import { type FileBackendCodexWorkerJob, type FileBackendCodexWorkerOptions, type FileBackendCodexWorkerResult } from "./file-backend-codex-worker.js";
export type FileBackendCodexSafeExecutorAccount = {
    readonly worker: Omit<FileBackendCodexWorkerOptions, "workspace" | "workspacePath">;
    readonly codexAuthJson?: string;
    readonly codexAuthJsonPath?: string;
};
export type FileBackendCodexSafeExecutorOptions = {
    readonly executorId?: string;
    readonly stateRootDir: string;
    readonly workspacePath: string;
    readonly accounts: readonly FileBackendCodexSafeExecutorAccount[];
    readonly accountCapacityStore?: WorkerAccountCapacityStore;
    readonly lockStore?: WorkspaceLockStore;
    readonly journal?: AttemptJournal;
    readonly safeExecutionPolicy?: SafeExecutionPolicy;
    readonly maxAccountCycles?: number;
    readonly effectMode?: TaskEffectMode;
    readonly staleLockMs?: number;
    readonly prewarmOnStart?: boolean;
    readonly maxQueueSize?: number;
    readonly shutdownTimeoutMs?: number;
    readonly clock?: {
        now(): Date;
    };
};
export type FileBackendCodexSafeExecutorRunInput = FileBackendCodexWorkerJob & {
    readonly taskId: string;
    readonly originalPrompt?: string;
    readonly effectMode?: TaskEffectMode;
    readonly staleLockMs?: number;
    readonly maxAccountCycles?: number;
    readonly safeExecutionPolicy?: SafeExecutionPolicy;
};
export declare class FileBackendCodexSafeExecutor {
    private readonly options;
    readonly accountCapacityStore: WorkerAccountCapacityStore;
    private readonly executorId;
    private readonly workerAccounts;
    private roundRobinSlotCursor;
    private readonly pool;
    private readonly runner;
    private startPromise;
    private disposed;
    constructor(options: FileBackendCodexSafeExecutorOptions);
    start(): Promise<void>;
    prewarm(): Promise<void>;
    run(input: FileBackendCodexSafeExecutorRunInput): Promise<SafeExecutionRunResult<FileBackendCodexWorkerResult>>;
    health(): Promise<WorkerPoolHealth>;
    stats(): WorkerPoolStats;
    dispose(): Promise<void>;
    private startOnce;
    private seedAccounts;
    private selectRoundRobinSlot;
}
//# sourceMappingURL=file-backend-codex-safe-executor.d.ts.map