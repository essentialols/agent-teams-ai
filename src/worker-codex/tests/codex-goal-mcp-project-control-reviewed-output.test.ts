import { describe, expect, it } from "vitest";
import type { ProjectAccessScope } from "@vioxen/subscription-runtime/worker-core";
import { parseReviewedOutputMerge } from "../codex-goal-mcp-project-control-reviewed-output";

const scope: ProjectAccessScope = {
  projectId: "hosted-web",
  allowedBranches: ["main", "fix/hosted-web-*"],
  allowedGitRemotes: ["origin"],
};

describe("parseReviewedOutputMerge", () => {
  it("allows a source branch matching the project branch glob", () => {
    expect(parseReviewedOutputMerge(scope, {
      sourceRemote: "origin",
      sourceBranch: "fix/hosted-web-rejected-router-rollback-source-v18-r1",
      sourceCommit: "2".repeat(40),
      expectedTargetCommit: "3".repeat(40),
    })).toEqual({
      sourceRemote: "origin",
      sourceBranch: "fix/hosted-web-rejected-router-rollback-source-v18-r1",
      sourceCommit: "2".repeat(40),
      expectedTargetCommit: "3".repeat(40),
    });
  });

  it("denies a source branch that does not match the project branch glob", () => {
    expect(() => parseReviewedOutputMerge(scope, {
      sourceRemote: "origin",
      sourceBranch: "feature/unrelated",
      sourceCommit: "2".repeat(40),
      expectedTargetCommit: "3".repeat(40),
    })).toThrow("reviewed_worker_output_merge_source_branch_denied");
  });
});
