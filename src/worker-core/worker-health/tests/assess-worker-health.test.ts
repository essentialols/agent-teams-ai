import { describe, expect, it } from "vitest";

import { assessWorkerHealth } from "../index";

describe("assessWorkerHealth", () => {
  it("keeps fresh alive workers unsafe to continue because an active writer exists", () => {
    expect(assessWorkerHealth({
      status: "running",
      processAlive: true,
      progressStatus: "running",
      progressHeartbeatAgeMs: 1_000,
      staleAfterMs: 60_000,
      workspaceDirty: true,
      changedFilesCount: 1,
    })).toMatchObject({
      alive: true,
      freshProgressAlive: true,
      stale: false,
      safeToContinue: false,
      activeWriterRisk: {
        kind: "active_worker",
        risky: true,
      },
    });
  });

  it("marks silent stale workers as live writer risk that needs inspection", () => {
    expect(assessWorkerHealth({
      status: "running",
      processAlive: true,
      progressStatus: "running",
      progressHeartbeatAgeMs: 120_000,
      staleAfterMs: 60_000,
      silentStale: true,
      workspaceDirty: false,
      changedFilesCount: 0,
    })).toMatchObject({
      alive: true,
      freshProgressAlive: false,
      stale: true,
      silentStale: true,
      safeToContinue: false,
      activeWriterRisk: {
        kind: "stale_live_worker",
      },
    });
  });

  it("treats heartbeat-only no-output as stale live risk", () => {
    expect(assessWorkerHealth({
      status: "running",
      processAlive: true,
      progressStatus: "running",
      progressHeartbeatAgeMs: 1_000,
      staleAfterMs: 60_000,
      heartbeatOnlyNoOutput: true,
      resultExists: false,
      workspaceDirty: false,
      changedFilesCount: 0,
    })).toMatchObject({
      heartbeatOnlyNoOutput: true,
      safeToContinue: false,
      activeWriterRisk: {
        kind: "stale_live_worker",
        reasons: ["heartbeat_only_no_output"],
      },
    });
  });

  it("blocks dirty stopped workspaces because output may need handoff review", () => {
    expect(assessWorkerHealth({
      status: "failed",
      processAlive: false,
      workspaceDirty: true,
      changedFilesCount: 2,
    })).toMatchObject({
      alive: false,
      safeToContinue: false,
      activeWriterRisk: {
        kind: "dirty_workspace_without_worker",
      },
    });
  });

  it("allows clean stopped workers as a runtime fact without launching anything", () => {
    expect(assessWorkerHealth({
      status: "failed",
      processAlive: false,
      workspaceDirty: false,
      changedFilesCount: 0,
    })).toMatchObject({
      alive: false,
      blocked: false,
      safeToContinue: true,
      activeWriterRisk: {
        kind: "none",
      },
    });
  });

  it("treats completed result with a live process as state mismatch", () => {
    expect(assessWorkerHealth({
      status: "completed",
      processAlive: true,
      resultExists: true,
      resultStatus: "completed",
    })).toMatchObject({
      alive: true,
      safeToContinue: false,
      activeWriterRisk: {
        kind: "state_mismatch",
      },
    });
  });

  it("honors unsafe control inbox state without owning orchestration policy", () => {
    expect(assessWorkerHealth({
      status: "stopped",
      processAlive: false,
      controlInboxPendingCount: 1,
      controlInboxSafeToContinue: false,
    })).toMatchObject({
      safeToContinue: false,
      reasons: expect.arrayContaining(["control_inbox_blocks_continuation"]),
    });
  });
});
