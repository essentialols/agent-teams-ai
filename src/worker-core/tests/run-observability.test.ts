import { describe, expect, it } from "vitest";
import {
  RunObservationService,
  decideRunObservation,
  type RunObservationPort,
  type RunObservationSnapshot,
} from "../index";

describe("RunObservationService", () => {
  it("normalizes read-only observations from provider adapters", async () => {
    const port: RunObservationPort = {
      async listRunIds() {
        return ["run-a"];
      },
      async observeRun(input) {
        return snapshot({
          runId: input.runId,
          status: "running",
          liveness: "alive",
        });
      },
    };

    const service = new RunObservationService(port, {
      clock: { now: () => new Date("2026-06-30T00:00:00.000Z") },
    });

    const [observed] = await service.observeRuns();

    expect(observed).toMatchObject({
      runId: "run-a",
      providerKind: "fake",
      observedAt: "2026-06-30T00:00:00.000Z",
      status: "running",
      liveness: "alive",
      readOnlyDecision: {
        kind: "keep_watching",
      },
    });
  });
});

describe("decideRunObservation", () => {
  it("flags completed results that still have a live process", () => {
    expect(decideRunObservation({
      status: "completed",
      liveness: "alive",
      result: { exists: true, status: "completed" },
    })).toMatchObject({
      kind: "unsafe_state_mismatch",
      reason: "completed_result_with_live_process",
    });
  });

  it("keeps fresh alive workers in watch-only mode", () => {
    expect(decideRunObservation({
      status: "running",
      liveness: "alive",
      progress: {
        status: "running",
        heartbeatAgeMs: 1_000,
        staleAfterMs: 60_000,
        stale: false,
      },
    })).toMatchObject({
      kind: "keep_watching",
    });
  });

  it("requires inspection for silent-stale workers", () => {
    expect(decideRunObservation({
      status: "running",
      liveness: "stale",
      progress: {
        heartbeatAgeMs: 120_000,
        staleAfterMs: 60_000,
        stale: true,
        silentStale: true,
      },
    })).toMatchObject({
      kind: "stale_needs_inspection",
    });
  });

  it("does not prescribe recovery for dirty stopped workspaces", () => {
    expect(decideRunObservation({
      status: "failed",
      liveness: "dead",
      workspace: {
        dirty: true,
        changedFilesCount: 1,
        changedFiles: ["M src/file.ts"],
      },
    })).toMatchObject({
      kind: "manual_review_required",
    });
  });

  it("surfaces account and capacity blockers read-only", () => {
    expect(decideRunObservation({
      status: "stopped",
      liveness: "dead",
      capacity: [{
        account: "account-a",
        status: "ready",
        availability: "cooldown",
        reason: "quota_limited",
      }],
    })).toMatchObject({
      kind: "capacity_blocked",
    });
  });
});

function snapshot(input: {
  readonly runId: string;
  readonly status: RunObservationSnapshot["status"];
  readonly liveness: RunObservationSnapshot["liveness"];
}): RunObservationSnapshot {
  return {
    runId: input.runId,
    providerKind: "fake",
    observedAt: "",
    status: input.status,
    liveness: input.liveness,
    warnings: [],
    readOnlyDecision: decideRunObservation({
      status: input.status,
      liveness: input.liveness,
    }),
  };
}
