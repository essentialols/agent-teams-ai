export type WatchableJobStatus = {
    readonly jobId: string;
    readonly workerAlive: boolean;
    readonly safeToContinue: boolean;
    readonly workspaceKey?: string;
    readonly workspaceDirty?: boolean;
    readonly requiresManualReview?: boolean;
    readonly manualReviewReason?: string;
    readonly continueAfter?: Date;
    readonly summary?: Readonly<Record<string, unknown>>;
};
export type WatchableJobContinueResult = {
    readonly ok: boolean;
    readonly reason?: string;
    readonly summary?: Readonly<Record<string, unknown>>;
};
export type WatchableJobBackend = {
    listJobIds(): Promise<readonly string[]>;
    inspectJob(jobId: string): Promise<WatchableJobStatus>;
    continueJob(jobId: string): Promise<WatchableJobContinueResult>;
};
export type ReconcileWatchableJobsPolicy = {
    readonly continueSafeJobs?: boolean;
    readonly maxContinuesPerRun?: number;
    readonly now?: Date;
};
export type WatchableJobDecision = {
    readonly jobId: string;
    readonly action: "wait";
    readonly reason: "worker_alive";
    readonly status: WatchableJobStatus;
} | {
    readonly jobId: string;
    readonly action: "manual_review";
    readonly reason: string;
    readonly status: WatchableJobStatus;
} | {
    readonly jobId: string;
    readonly action: "blocked";
    readonly reason: string;
    readonly status: WatchableJobStatus;
} | {
    readonly jobId: string;
    readonly action: "skipped";
    readonly reason: string;
    readonly status: WatchableJobStatus;
} | {
    readonly jobId: string;
    readonly action: "would_continue";
    readonly reason: "dry_run";
    readonly status: WatchableJobStatus;
} | {
    readonly jobId: string;
    readonly action: "continued";
    readonly reason: "safe_to_continue";
    readonly status: WatchableJobStatus;
    readonly result: WatchableJobContinueResult;
} | {
    readonly jobId: string;
    readonly action: "inspect_failed";
    readonly reason: string;
};
export type ReconcileWatchableJobsResult = {
    readonly ok: boolean;
    readonly checked: number;
    readonly continued: number;
    readonly decisions: readonly WatchableJobDecision[];
};
export declare function reconcileWatchableJobs(input: {
    readonly backend: WatchableJobBackend;
    readonly jobIds?: readonly string[];
    readonly policy?: ReconcileWatchableJobsPolicy;
}): Promise<ReconcileWatchableJobsResult>;
//# sourceMappingURL=job-watch.d.ts.map