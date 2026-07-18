import { rm } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { LocalGitIntegrationAdapter } from "../index";
import {
  createTopologyOnlyMergeFixture,
  gitOutput,
  tempRoots,
} from "./project-integration-local-adapters.fixture";

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((path) =>
      rm(path, { recursive: true, force: true })
    ),
  );
});

describe("local topology-only merge integration", () => {
  it("creates an exact two-parent merge when the reviewed merge has no file diff", async () => {
    const fixture = await createTopologyOnlyMergeFixture();
    const adapter = new LocalGitIntegrationAdapter({
      allowedPatchRoots: [fixture.rootDir],
    });
    const attempt = {
      targetWorkspacePath: fixture.workspacePath,
      expectedFiles: [],
      merge: {
        sourceRemote: "origin",
        sourceBranch: "base",
        sourceCommit: fixture.sourceCommit,
        expectedTargetCommit: fixture.targetCommit,
      },
    };
    const workerOutput = {
      workerJobId: "topology-merge-reviewer",
      workspacePath: fixture.workspacePath,
      patchPath: fixture.patchPath,
      patchSha256: fixture.patchSha256,
      baseCommit: fixture.targetCommit,
      changedFiles: [],
    };

    await expect(adapter.applyWorkerOutput({ attempt, workerOutput }))
      .resolves.toEqual({ changedFiles: [] });
    await expect(adapter.getStatus({ workspacePath: fixture.workspacePath }))
      .resolves.toEqual({ branch: "main", dirtyFiles: [] });

    const commit = await adapter.commit({
      workspacePath: fixture.workspacePath,
      message: "chore(git): preserve reviewed merge topology",
      files: [],
      identity: { name: "Integrator", email: "integrator@example.com" },
      expectedParentCommits: [fixture.targetCommit, fixture.sourceCommit],
    });
    expect(commit.parentCommits).toEqual([
      fixture.targetCommit,
      fixture.sourceCommit,
    ]);
    await expect(adapter.commit({
      workspacePath: fixture.workspacePath,
      message: "chore(git): preserve reviewed merge topology",
      files: [],
      identity: { name: "Integrator", email: "integrator@example.com" },
      expectedParentCommits: [fixture.targetCommit, fixture.sourceCommit],
    })).resolves.toEqual(commit);
    await expect(gitOutput(fixture.workspacePath, [
      "diff",
      "--name-only",
      `${commit.commitSha}^1`,
      commit.commitSha,
    ])).resolves.toBe("");
  });
});
