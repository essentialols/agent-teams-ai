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
  it("discards reviewed source drift and creates an exact target-tree two-parent merge", async () => {
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
    await expect(gitOutput(fixture.workspacePath, [
      "diff",
      "--name-only",
      "--no-renames",
      fixture.targetCommit,
      fixture.sourceCommit,
    ])).resolves.toBe("src/shared.ts\nsrc/source-only.ts\n");
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
    await expect(Promise.all([
      gitOutput(fixture.workspacePath, ["rev-parse", `${commit.commitSha}^{tree}`]),
      gitOutput(fixture.workspacePath, ["rev-parse", `${fixture.targetCommit}^{tree}`]),
    ])).resolves.toSatisfy(([mergeTree, targetTree]) =>
      mergeTree === targetTree
    );
  });

  it("aborts when the pending merge footprint does not equal the pinned target-to-source diff", async () => {
    const fixture = await createTopologyOnlyMergeFixture({
      targetOnlyChange: true,
    });
    const adapter = new LocalGitIntegrationAdapter({
      allowedPatchRoots: [fixture.rootDir],
    });

    await expect(adapter.applyWorkerOutput({
      attempt: {
        targetWorkspacePath: fixture.workspacePath,
        expectedFiles: [],
        merge: {
          sourceRemote: "origin",
          sourceBranch: "base",
          sourceCommit: fixture.sourceCommit,
          expectedTargetCommit: fixture.targetCommit,
        },
      },
      workerOutput: {
        workerJobId: "topology-merge-reviewer",
        workspacePath: fixture.workspacePath,
        patchPath: fixture.patchPath,
        patchSha256: fixture.patchSha256,
        baseCommit: fixture.targetCommit,
        changedFiles: [],
      },
    })).rejects.toThrow(
      "local_git_integration_topology_only_footprint_mismatch",
    );
    await expect(adapter.getStatus({ workspacePath: fixture.workspacePath }))
      .resolves.toEqual({ branch: "main", dirtyFiles: [] });
    await expect(gitOutput(fixture.workspacePath, ["rev-parse", "HEAD"]))
      .resolves.toBe(`${fixture.targetCommit}\n`);
  });
});
