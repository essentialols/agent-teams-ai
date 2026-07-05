import { describe, expect, it } from "vitest";

import { assessWorkerHealth } from "../../worker-health";
import { buildWorkerStatusView } from "../index";

describe("buildWorkerStatusView", () => {
  it("exposes runtime facts without orchestration policy", () => {
    const health = assessWorkerHealth({
      status: "running",
      processAlive: true,
      progressStatus: "running",
      progressHeartbeatAgeMs: 1_000,
      staleAfterMs: 60_000,
    });

    expect(buildWorkerStatusView({
      model: "gpt-5.5",
      effort: "xhigh",
      serviceTier: "fast",
      account: "account-a",
      accessBoundary: "isolated_workspace_write",
      baseCommit: "abc123",
      targetCommit: "def456",
      baseStatus: "needs_rebase_check",
      freshAgeMs: 1_000,
      staleAfterMs: 60_000,
      dirtyFilesCount: 0,
      health,
      nextBestActionHint: "codex_goal_brief",
    })).toEqual({
      model: "gpt-5.5",
      effort: "xhigh",
      serviceTier: "fast",
      account: "account-a",
      accessBoundary: "isolated_workspace_write",
      baseCommit: "abc123",
      targetCommit: "def456",
      baseStatus: "needs_rebase_check",
      freshAgeMs: 1_000,
      staleAfterMs: 60_000,
      dirtyFilesCount: 0,
      activeWriterRisk: "active_worker",
      safeToContinue: false,
      nextBestActionHint: "codex_goal_brief",
    });
  });

  it("keeps old manifests usable by omitting unknown optional fields", () => {
    const health = assessWorkerHealth({
      status: "stopped",
      processAlive: false,
      workspaceDirty: false,
      changedFilesCount: 0,
    });

    expect(buildWorkerStatusView({ health })).toEqual({
      activeWriterRisk: "none",
      safeToContinue: true,
    });
  });
});
