import { describe, expect, it } from "vitest";
import {
  reconcileWatchableJobs,
  type WatchableJobBackend,
  type WatchableJobStatus,
} from "../index";

describe("reconcileWatchableJobs", () => {
  it("continues only safe stopped jobs within the configured budget", async () => {
    const continued: string[] = [];
    const backend = fakeBackend([
      job({ jobId: "running", workerAlive: true }),
      job({ jobId: "safe-a", safeToContinue: true }),
      job({ jobId: "safe-b", safeToContinue: true }),
      job({ jobId: "dirty", safeToContinue: true, workspaceDirty: true }),
    ], continued);

    const result = await reconcileWatchableJobs({
      backend,
      policy: {
        continueSafeJobs: true,
        maxContinuesPerRun: 1,
      },
    });

    expect(result.continued).toBe(1);
    expect(continued).toEqual(["safe-a"]);
    expect(result.decisions.map((decision) => [
      decision.jobId,
      decision.action,
      decision.reason,
    ])).toEqual([
      ["running", "wait", "worker_alive"],
      ["safe-a", "continued", "safe_to_continue"],
      ["safe-b", "skipped", "max_continues_reached"],
      ["dirty", "manual_review", "workspace_dirty"],
    ]);
  });

  it("blocks multiple potential writers for the same workspace", async () => {
    const continued: string[] = [];
    const backend = fakeBackend([
      job({ jobId: "safe-a", safeToContinue: true, workspaceKey: "/work" }),
      job({ jobId: "safe-b", safeToContinue: true, workspaceKey: "/work" }),
    ], continued);

    const result = await reconcileWatchableJobs({
      backend,
      policy: {
        continueSafeJobs: true,
        maxContinuesPerRun: 2,
      },
    });

    expect(result.continued).toBe(0);
    expect(continued).toEqual([]);
    expect(result.decisions.map((decision) => [
      decision.jobId,
      decision.action,
      decision.reason,
    ])).toEqual([
      ["safe-a", "blocked", "single_writer_workspace_conflict"],
      ["safe-b", "blocked", "single_writer_workspace_conflict"],
    ]);
  });

  it("supports dry-run reconciliation without continuing jobs", async () => {
    const continued: string[] = [];
    const backend = fakeBackend([
      job({ jobId: "safe", safeToContinue: true }),
    ], continued);

    const result = await reconcileWatchableJobs({ backend });

    expect(result.continued).toBe(0);
    expect(continued).toEqual([]);
    expect(result.decisions[0]).toMatchObject({
      jobId: "safe",
      action: "would_continue",
      reason: "dry_run",
    });
  });
});

function fakeBackend(
  statuses: readonly WatchableJobStatus[],
  continued: string[],
): WatchableJobBackend {
  const byId = new Map(statuses.map((status) => [status.jobId, status]));
  return {
    async listJobIds() {
      return [...byId.keys()];
    },
    async inspectJob(jobId) {
      const status = byId.get(jobId);
      if (!status) throw new Error(`missing job ${jobId}`);
      return status;
    },
    async continueJob(jobId) {
      continued.push(jobId);
      return {
        ok: true,
        summary: { jobId },
      };
    },
  };
}

function job(input: {
  readonly jobId: string;
  readonly workerAlive?: boolean;
  readonly safeToContinue?: boolean;
  readonly workspaceKey?: string;
  readonly workspaceDirty?: boolean;
}): WatchableJobStatus {
  return {
    jobId: input.jobId,
    workerAlive: input.workerAlive ?? false,
    safeToContinue: input.safeToContinue ?? false,
    ...(input.workspaceKey ? { workspaceKey: input.workspaceKey } : {}),
    ...(input.workspaceDirty === undefined
      ? {}
      : { workspaceDirty: input.workspaceDirty }),
  };
}
