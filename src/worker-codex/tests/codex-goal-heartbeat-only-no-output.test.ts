import { describe, expect, it } from "vitest";
import { isCodexGoalHeartbeatOnlyNoOutput } from "../application/codex-goal-decision";

describe("Codex goal heartbeat-only no-output classification", () => {
  it("does not treat an idle app-server or synthetic heartbeat as productive work", () => {
    const status = idleAppServerStatus();

    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status,
      staleAfterMs: 10 * 60_000,
    })).toBe(true);
  });

  it("keeps a real workload child or recent provider event protected", () => {
    const status = idleAppServerStatus();

    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status: { ...status, workloadProcessAlive: true },
      staleAfterMs: 10 * 60_000,
    })).toBe(false);
    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status: { ...status, lastRuntimeEventAt: new Date().toISOString() },
      staleAfterMs: 10 * 60_000,
    })).toBe(false);
  });

  it("requires review when app-server workload observation is unavailable", () => {
    const { workloadProcessAlive: _workloadProcessAlive, ...status } =
      idleAppServerStatus();

    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status,
      staleAfterMs: 10 * 60_000,
    })).toBe(true);
  });

  it("requires review for unknown or idle direct-pid-fallback observations", () => {
    const {
      appServerProcessAlive: _appServerProcessAlive,
      workloadProcessAlive: _workloadProcessAlive,
      progressCpuActive: _progressCpuActive,
      ...unknownProcessStatus
    } = idleAppServerStatus();

    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status: unknownProcessStatus,
      staleAfterMs: 10 * 60_000,
    })).toBe(true);
    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status: { ...unknownProcessStatus, progressCpuActive: false },
      staleAfterMs: 10 * 60_000,
    })).toBe(true);
  });

  it("requires explicit idle evidence for a non-app-server process", () => {
    const status = {
      ...idleAppServerStatus(),
      appServerProcessAlive: false,
      progressCpuActive: false,
    };
    const { workloadProcessAlive: _workloadProcessAlive, ...withoutWorkload } =
      status;

    expect(isCodexGoalHeartbeatOnlyNoOutput({
      status: withoutWorkload,
      staleAfterMs: 10 * 60_000,
    })).toBe(true);
  });
});

function idleAppServerStatus() {
  return {
    tmuxAlive: true,
    recommendedAction: "wait_for_worker",
    workspaceDirty: false,
    changedFiles: [],
    resultExists: false,
    logExists: true,
    logByteLength: 0,
    logUpdatedAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    progressExists: true,
    progressStatus: "running",
    progressHeartbeatAgeMs: 1_000,
    progressProcessAlive: true,
    progressCpuActive: true,
    appServerProcessAlive: true,
    workloadProcessAlive: false,
    lastRuntimeEvent: "runtime_observability_event",
    lastRuntimeEventAt: new Date(Date.now() - 20 * 60_000).toISOString(),
  };
}
