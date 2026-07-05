import { describe, expect, it } from "vitest";

import { assessBaseRevision } from "../index";

describe("assessBaseRevision", () => {
  it("marks matching worker and target commits as current", () => {
    expect(assessBaseRevision({
      workerBase: { commit: "abc123" },
      target: { commit: "abc123" },
      outputChangedFiles: ["src/a.ts"],
    })).toEqual({
      status: "current",
      workerBaseCommit: "abc123",
      targetCommit: "abc123",
      reasons: [],
    });
  });

  it("marks changed output from an old base as needing rebase check", () => {
    expect(assessBaseRevision({
      workerBase: { commit: "abc123" },
      target: { commit: "def456" },
      outputChangedFiles: ["src/a.ts"],
    })).toEqual({
      status: "needs_rebase_check",
      workerBaseCommit: "abc123",
      targetCommit: "def456",
      reasons: ["target_advanced", "output_changed_on_stale_base"],
    });
  });

  it("marks no-diff output from an old base as stale without requiring rebase", () => {
    expect(assessBaseRevision({
      workerBase: { commit: "abc123" },
      target: { commit: "def456" },
      outputNoDiff: true,
    })).toEqual({
      status: "stale",
      workerBaseCommit: "abc123",
      targetCommit: "def456",
      reasons: ["target_advanced"],
    });
  });

  it("does not guess when either side of the base comparison is missing", () => {
    expect(assessBaseRevision({
      workerBase: {},
      outputChangedFiles: ["src/a.ts"],
    })).toEqual({
      status: "unknown",
      reasons: ["worker_base_commit_missing", "target_commit_missing"],
    });
  });

  it("normalizes blank commit strings before assessing", () => {
    expect(assessBaseRevision({
      workerBase: { commit: "  " },
      target: { commit: " def456 " },
    })).toEqual({
      status: "unknown",
      targetCommit: "def456",
      reasons: ["worker_base_commit_missing"],
    });
  });
});
