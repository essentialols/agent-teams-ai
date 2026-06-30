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

export type WatchableJobDecision =
  | {
      readonly jobId: string;
      readonly action: "wait";
      readonly reason: "worker_alive";
      readonly status: WatchableJobStatus;
    }
  | {
      readonly jobId: string;
      readonly action: "manual_review";
      readonly reason: string;
      readonly status: WatchableJobStatus;
    }
  | {
      readonly jobId: string;
      readonly action: "blocked";
      readonly reason: string;
      readonly status: WatchableJobStatus;
    }
  | {
      readonly jobId: string;
      readonly action: "skipped";
      readonly reason: string;
      readonly status: WatchableJobStatus;
    }
  | {
      readonly jobId: string;
      readonly action: "would_continue";
      readonly reason: "dry_run";
      readonly status: WatchableJobStatus;
    }
  | {
      readonly jobId: string;
      readonly action: "continued";
      readonly reason: "safe_to_continue";
      readonly status: WatchableJobStatus;
      readonly result: WatchableJobContinueResult;
    }
  | {
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

export async function reconcileWatchableJobs(input: {
  readonly backend: WatchableJobBackend;
  readonly jobIds?: readonly string[];
  readonly policy?: ReconcileWatchableJobsPolicy;
}): Promise<ReconcileWatchableJobsResult> {
  const policy = input.policy ?? {};
  const now = policy.now ?? new Date();
  const maxContinues = policy.maxContinuesPerRun ?? 1;
  const jobIds = input.jobIds ?? await input.backend.listJobIds();
  const inspected = await Promise.all(
    jobIds.map(async (jobId) => {
      try {
        return { ok: true as const, status: await input.backend.inspectJob(jobId) };
      } catch (error) {
        return {
          ok: false as const,
          jobId,
          reason: error instanceof Error ? error.message : "inspect_failed",
        };
      }
    }),
  );
  const conflicts = workspaceConflictJobIds(
    inspected
      .filter((item): item is { readonly ok: true; readonly status: WatchableJobStatus } =>
        item.ok
      )
      .map((item) => item.status),
  );
  const decisions: WatchableJobDecision[] = [];
  let continued = 0;
  for (const item of inspected) {
    if (!item.ok) {
      decisions.push({
        jobId: item.jobId,
        action: "inspect_failed",
        reason: item.reason,
      });
      continue;
    }
    const status = item.status;
    const decision = await decideWatchableJob({
      backend: input.backend,
      status,
      conflicts,
      now,
      continueSafeJobs: policy.continueSafeJobs === true,
      continueBudgetRemaining: Math.max(0, maxContinues - continued),
    });
    decisions.push(decision);
    if (decision.action === "continued") continued += 1;
  }

  return {
    ok: decisions.every((decision) =>
      decision.action !== "inspect_failed" &&
      decision.action !== "blocked"
    ),
    checked: decisions.length,
    continued,
    decisions,
  };
}

async function decideWatchableJob(input: {
  readonly backend: WatchableJobBackend;
  readonly status: WatchableJobStatus;
  readonly conflicts: ReadonlySet<string>;
  readonly now: Date;
  readonly continueSafeJobs: boolean;
  readonly continueBudgetRemaining: number;
}): Promise<WatchableJobDecision> {
  const status = input.status;
  if (status.workerAlive) {
    return {
      jobId: status.jobId,
      action: "wait",
      reason: "worker_alive",
      status,
    };
  }
  if (status.requiresManualReview) {
    return {
      jobId: status.jobId,
      action: "manual_review",
      reason: status.manualReviewReason ?? "manual_review_required",
      status,
    };
  }
  if (status.workspaceDirty) {
    return {
      jobId: status.jobId,
      action: "manual_review",
      reason: "workspace_dirty",
      status,
    };
  }
  if (input.conflicts.has(status.jobId)) {
    return {
      jobId: status.jobId,
      action: "blocked",
      reason: "single_writer_workspace_conflict",
      status,
    };
  }
  if (!status.safeToContinue) {
    return {
      jobId: status.jobId,
      action: "skipped",
      reason: "not_safe_to_continue",
      status,
    };
  }
  if (status.continueAfter && status.continueAfter.getTime() > input.now.getTime()) {
    return {
      jobId: status.jobId,
      action: "skipped",
      reason: "continue_cooldown",
      status,
    };
  }
  if (!input.continueSafeJobs) {
    return {
      jobId: status.jobId,
      action: "would_continue",
      reason: "dry_run",
      status,
    };
  }
  if (input.continueBudgetRemaining <= 0) {
    return {
      jobId: status.jobId,
      action: "skipped",
      reason: "max_continues_reached",
      status,
    };
  }
  return {
    jobId: status.jobId,
    action: "continued",
    reason: "safe_to_continue",
    status,
    result: await input.backend.continueJob(status.jobId),
  };
}

function workspaceConflictJobIds(
  statuses: readonly WatchableJobStatus[],
): ReadonlySet<string> {
  const groups = new Map<string, WatchableJobStatus[]>();
  for (const status of statuses) {
    if (!status.workspaceKey) continue;
    if (!status.workerAlive && !status.safeToContinue) continue;
    groups.set(status.workspaceKey, [
      ...(groups.get(status.workspaceKey) ?? []),
      status,
    ]);
  }
  const conflicts = new Set<string>();
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    for (const status of group) conflicts.add(status.jobId);
  }
  return conflicts;
}
