import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildCodexGoalBrief } from "../application/codex-goal-brief";
import { buildCodexGoalDecision } from "../application/codex-goal-decision";

describe("Codex goal handoff readiness", () => {
  it("blocks handoff readiness when product completion could not materialize", async () => {
    const root = await mkdtemp(join(tmpdir(), "codex-handoff-readiness-"));
    const jobRootDir = join(root, "worker-jobs", "worker-1");
    const workspacePath = join(root, "workspace");
    const resultPath = join(jobRootDir, "task-1.latest-result.json");
    const logPath = join(jobRootDir, "task-1.log");
    await mkdir(jobRootDir, { recursive: true });
    await mkdir(workspacePath, { recursive: true });
    await writeFile(logPath, "completed\n");
    await writeFile(resultPath, `${JSON.stringify({
      schemaVersion: 1,
      status: "done",
      changedFiles: ["auth.json"],
      evidence: [
        "handoff_artifact_materialization_failed:handoff_sensitive_path_rejected",
      ],
      blockers: [],
      nextAction: "review_completed",
      details: {
        handoffArtifactError: "handoff_sensitive_path_rejected",
      },
    })}\n`);
    const launch = {
      cwd: workspacePath,
      logPath,
      cliCommand: ["subscription-runtime-codex-goal"],
      config: {
        jobId: "worker-1",
        jobRootDir,
        authRootDir: join(root, "auth"),
        workspacePath,
        promptPath: join(jobRootDir, "prompt.md"),
        taskId: "task-1",
        accounts: [],
        outputPath: resultPath,
      },
    } as const;
    const status = {
      tmuxAlive: false,
      resultPath,
      resultExists: true,
      resultStatus: "done",
      workspaceExists: true,
      workspaceDirty: true,
      changedFiles: ["auth.json"],
      logPath,
      logExists: true,
      logByteLength: 10,
      recommendedAction: "review_completed",
      warnings: [],
    } as const;

    try {
      const brief = await buildCodexGoalBrief({
        jobId: "worker-1",
        launch,
        status,
        accounts: [],
        staleAfterMs: 60_000,
        tailLines: 20,
      });
      expect(brief).toMatchObject({
        handoffArtifactError: "handoff_sensitive_path_rejected",
        nextBestTool: "manual_review",
        nextBestReason: "handoff_artifact_materialization_failed",
        safeToContinue: false,
      });

      const decision = buildCodexGoalDecision({
        registryRootDir: join(root, "registry"),
        manifest: { jobId: "worker-1" } as never,
        launch,
        status,
        accounts: [],
        brief,
      });
      expect(decision).toMatchObject({
        decision: "manual_review_handoff_artifact",
        severity: "blocked",
        blockers: expect.arrayContaining([expect.objectContaining({
          code: "handoff_artifact_materialization_failed",
          errorCode: "handoff_sensitive_path_rejected",
        })]),
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
