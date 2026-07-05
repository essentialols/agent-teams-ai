import { describe, expect, it } from "vitest";

import { buildHandoffManifest } from "../index";

describe("buildHandoffManifest", () => {
  it("builds the public handoff manifest through the validation policy", () => {
    expect(buildHandoffManifest({
      workerJobId: "worker-a",
      workspacePath: "/work/worker-a",
      createdAt: "2026-07-05T00:00:00.000Z",
      baseCommit: "abc123",
      patchPath: "handoff.patch",
      changedFiles: ["src/a.ts"],
      checks: [{ checkId: "typecheck", status: "passed" }],
      workspaceDirty: true,
    })).toMatchObject({
      workerJobId: "worker-a",
      baseCommit: "abc123",
      patchPath: "handoff.patch",
      changedFiles: ["src/a.ts"],
      status: "valid",
      issues: [],
    });
  });
});
