import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  AccessBoundary,
  NetworkAccessMode,
  type ProjectAccessScope,
  type ProjectControlBroker,
} from "@vioxen/subscription-runtime/worker-core";

import { materializeCodexGoalHandoffArtifacts } from "../codex-goal-handoff-artifacts";
import {
  createCodexGoalJob,
  type CodexGoalJobManifest,
} from "../codex-goal-jobs";
import {
  terminalHandoffDependencyRecoveryRequested,
  terminalHandoffRuntimeInterruptContinuationRequested,
  verifyTerminalHandoffRecovery,
} from "../application/project-control/codex-goal-project-terminal-handoff-recovery";
import { localReviewedWorkerOutputDeps } from "../reviewed-worker-output";
import {
  projectControlStartStoredJobView,
  type CodexGoalMcpProjectControlActionsDeps,
} from "../codex-goal-mcp-project-control-actions";
import { git, gitInitRepository } from "./codex-goal-mcp-test-support";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("terminal worker handoff recovery", () => {
  it("requires the complete explicit dependency-recovery intent", () => {
    const request = {
      status: {
        workspaceDirty: true,
        resultExists: true,
        resultStatus: "done",
        recommendedAction: "review_completed",
      },
      forceStart: true,
      dependencyBootstrap: "install",
      confirmDependencyBootstrap: true,
    } as const;
    expect(terminalHandoffDependencyRecoveryRequested(request)).toBe(true);
    for (const invalid of [
      { ...request, status: { ...request.status, workspaceDirty: false } },
      { ...request, reviewedOutputId: "a".repeat(64) },
      { ...request, forceStart: false },
      { ...request, dependencyBootstrap: "preflight" },
      { ...request, confirmDependencyBootstrap: false },
      { ...request, status: { ...request.status, resultExists: false } },
      { ...request, status: { ...request.status, resultStatus: "failed" } },
      {
        ...request,
        status: {
          ...request.status,
          recommendedAction: "inspect_dirty_workspace" as const,
        },
      },
    ]) {
      expect(terminalHandoffDependencyRecoveryRequested(invalid)).toBe(false);
    }
  });

  it("recognizes only a stopped strict runtime-interrupted continuation", () => {
    const request = {
      status: {
        workspaceDirty: true,
        resultExists: true,
        resultStatus: "partial",
        resultReason: "runtime_interrupted",
        recommendedAction: "inspect_dirty_failure",
      },
      forceStart: true,
      workerAlive: false,
    } as const;
    expect(
      terminalHandoffRuntimeInterruptContinuationRequested(request),
    ).toBe(true);
    for (const invalid of [
      { ...request, status: { ...request.status, workspaceDirty: false } },
      { ...request, reviewedOutputId: "a".repeat(64) },
      { ...request, forceStart: false },
      { ...request, workerAlive: true },
      { ...request, status: { ...request.status, resultExists: false } },
      { ...request, status: { ...request.status, resultStatus: "done" } },
      {
        ...request,
        status: { ...request.status, resultReason: "goal_slice_exhausted" },
      },
      {
        ...request,
        status: {
          ...request.status,
          recommendedAction: "review_completed" as const,
        },
      },
    ]) {
      expect(
        terminalHandoffRuntimeInterruptContinuationRequested(invalid),
      ).toBe(false);
    }
  });

  it("permits only the exact runtime-captured dirty workspace", async () => {
    const root = await mkdtemp(
      join(tmpdir(), "subscription-runtime-terminal-recovery-"),
    );
    roots.push(root);
    const workspacePath = join(root, "workspace");
    const jobRootDir = join(root, "job");
    const jobId = "project-worker";
    await Promise.all([
      mkdir(workspacePath, { recursive: true }),
      mkdir(jobRootDir, { recursive: true }),
    ]);
    await gitInitRepository(workspacePath);
    await writeFile(
      join(workspacePath, "owned.ts"),
      "export const value = 1;\n",
    );
    await git(workspacePath, ["add", "owned.ts"]);
    await git(workspacePath, ["commit", "-m", "test: base"]);
    await writeFile(
      join(workspacePath, "owned.ts"),
      "export const value = 2;\n",
    );

    const handoff = await materializeCodexGoalHandoffArtifacts({
      workerJobId: jobId,
      taskId: jobId,
      workspacePath,
      jobRootDir,
    });
    expect(handoff).not.toBeNull();
    await writeTerminalResult(jobRootDir, jobId, handoff!);
    const producer = {
      jobId,
      taskId: jobId,
      workspacePath,
      jobRootDir,
    } as CodexGoalJobManifest;
    const snapshotter = localReviewedWorkerOutputDeps({
      rootDir: join(root, "reviewed-output"),
    }).snapshotter;

    await expect(
      verifyTerminalHandoffRecovery({
        producer,
        workspacePath,
        snapshotter,
      }),
    ).resolves.toMatchObject({
      patchSha256: handoff!.manifest.artifacts.patch.sha256,
      baseCommit: handoff!.baseCommit,
      changedFiles: ["owned.ts"],
    });

    await writeFile(
      join(workspacePath, "owned.ts"),
      "export const value = 3;\n",
    );
    await expect(
      verifyTerminalHandoffRecovery({
        producer,
        workspacePath,
        snapshotter,
      }),
    ).rejects.toThrow(
      "project_control_terminal_handoff_workspace_changed_after_capture",
    );
  });

  it("pins the pre-bootstrap handoff and rejects reviewed output", async () => {
    const fixture = await recoveryFixture();
    const before = await verifyTerminalHandoffRecovery(fixture.verifyInput);
    await writeFile(
      join(fixture.workspacePath, "owned.ts"),
      "export const value = 3;\n",
    );
    const next = await materializeCodexGoalHandoffArtifacts({
      workerJobId: fixture.jobId,
      taskId: fixture.jobId,
      workspacePath: fixture.workspacePath,
      jobRootDir: fixture.jobRootDir,
    });
    if (!next) throw new Error("expected next handoff");
    await writeTerminalResult(fixture.jobRootDir, fixture.jobId, next);
    await expect(
      verifyTerminalHandoffRecovery({
        ...fixture.verifyInput,
        expected: before,
      }),
    ).rejects.toThrow(
      "project_control_terminal_handoff_changed_during_dependency_bootstrap",
    );

    await writeFile(
      join(fixture.jobRootDir, `${fixture.jobId}.review.json`),
      '{"reviewedAt":"2026-07-14T00:00:00.000Z","decision":"rejected"}\n',
    );
    await expect(
      verifyTerminalHandoffRecovery(fixture.verifyInput),
    ).rejects.toThrow("project_control_terminal_handoff_already_reviewed");
  });

  it("accepts only the same-job strict runtime-interrupted handoff", async () => {
    const fixture = await recoveryFixture({
      status: "partial",
      reason: "runtime_interrupted",
      nextAction: "preserve_patch",
    });
    await expect(
      verifyTerminalHandoffRecovery({
        ...fixture.verifyInput,
        kind: "runtime_interrupt_continuation",
      }),
    ).resolves.toMatchObject({ changedFiles: ["owned.ts"] });

    const resultPath = join(
      fixture.jobRootDir,
      `${fixture.jobId}.latest-result.json`,
    );
    for (const producer of [
      { ...fixture.verifyInput.producer, jobId: "project-other" },
      {
        ...fixture.verifyInput.producer,
        taskId: "project-other-task",
        outputPath: resultPath,
      },
      {
        ...fixture.verifyInput.producer,
        workspacePath: fixture.jobRootDir,
      },
    ]) {
      await expect(
        verifyTerminalHandoffRecovery({
          ...fixture.verifyInput,
          producer,
          kind: "runtime_interrupt_continuation",
        }),
      ).rejects.toThrow("project_control_verifier_handoff_identity_mismatch");
    }

    await writeFile(
      resultPath,
      `${JSON.stringify({
        status: "partial",
        reason: "runtime_interrupted",
        changedFiles: ["owned.ts"],
        evidence: [],
        blockers: ["runtime_interrupted"],
        nextAction: "preserve_patch",
      })}\n`,
    );
    await expect(
      verifyTerminalHandoffRecovery({
        ...fixture.verifyInput,
        kind: "runtime_interrupt_continuation",
      }),
    ).rejects.toThrow("project_control_verifier_handoff_result_invalid");
  });

  it("continues the same terminal runtime-interrupted project job as adoption", async () => {
    const fixture = await actionFixture({
      status: "partial",
      reason: "runtime_interrupted",
      nextAction: "preserve_patch",
    });
    let workspaceMode: string | undefined;
    let workerRole: string | undefined;
    const started = await projectControlStartStoredJobView(
      {
        ...fixture.startArgs,
        dependencyBootstrap: "off",
        confirmDependencyBootstrap: false,
      },
      fixture.deps(
        async () => undefined,
        (input, request) => {
          workspaceMode = input.startAdmissionWorkspaceMode;
          workerRole = request.workerRole;
        },
      ),
    );
    expect(started).toMatchObject({
      ok: true,
      jobId: fixture.jobId,
      taskId: fixture.jobId,
      result: { status: "started" },
    });
    expect(workspaceMode).toBe(
      "terminal_handoff_runtime_interrupt_continuation",
    );
    expect(workerRole).toBe("adoption");
  });

  it("holds the project start lock across dependency bootstrap verification", async () => {
    const fixture = await actionFixture();
    await expect(
      projectControlStartStoredJobView(
        fixture.startArgs,
        fixture.deps(async () => {
          await writeFile(
            join(fixture.workspacePath, "owned.ts"),
            "export const value = 3;\n",
          );
          const next = await materializeCodexGoalHandoffArtifacts({
            workerJobId: fixture.jobId,
            taskId: fixture.jobId,
            workspacePath: fixture.workspacePath,
            jobRootDir: fixture.jobRootDir,
          });
          if (!next) throw new Error("expected next handoff");
          await writeTerminalResult(fixture.jobRootDir, fixture.jobId, next);
        }),
      ),
    ).rejects.toThrow(
      "project_control_terminal_handoff_changed_during_dependency_bootstrap",
    );
  });

  it.each(["approved", "rejected"])(
    "rejects a %s review marker before dependency bootstrap",
    async (decision) => {
      const fixture = await actionFixture();
      await writeFile(
        join(fixture.jobRootDir, `${fixture.jobId}.review.json`),
        `${JSON.stringify({ reviewedAt: new Date().toISOString(), decision })}\n`,
      );
      let bootstrapCalled = false;
      await expect(
        projectControlStartStoredJobView(
          fixture.startArgs,
          fixture.deps(async () => {
            bootstrapCalled = true;
          }),
        ),
      ).rejects.toThrow("project_control_terminal_handoff_already_reviewed");
      expect(bootstrapCalled).toBe(false);
    },
  );
});

async function recoveryFixture(
  result: TerminalResultOptions = {
    status: "done",
    nextAction: "review_completed",
  },
) {
  const root = await mkdtemp(
    join(tmpdir(), "subscription-runtime-terminal-recovery-pinned-"),
  );
  roots.push(root);
  const workspacePath = join(root, "workspace");
  const jobRootDir = join(root, "job");
  const jobId = "project-worker";
  await Promise.all([
    mkdir(workspacePath, { recursive: true }),
    mkdir(jobRootDir, { recursive: true }),
  ]);
  await gitInitRepository(workspacePath);
  await writeFile(join(workspacePath, "owned.ts"), "export const value = 1;\n");
  await git(workspacePath, ["add", "owned.ts"]);
  await git(workspacePath, ["commit", "-m", "test: base"]);
  await writeFile(join(workspacePath, "owned.ts"), "export const value = 2;\n");
  const handoff = await materializeCodexGoalHandoffArtifacts({
    workerJobId: jobId,
    taskId: jobId,
    workspacePath,
    jobRootDir,
  });
  if (!handoff) throw new Error("expected handoff");
  await writeTerminalResult(jobRootDir, jobId, handoff, result);
  const producer = {
    jobId,
    taskId: jobId,
    workspacePath,
    jobRootDir,
  } as CodexGoalJobManifest;
  const snapshotter = localReviewedWorkerOutputDeps({
    rootDir: join(root, "reviewed-output"),
  }).snapshotter;
  return {
    workspacePath,
    jobRootDir,
    jobId,
    verifyInput: { producer, workspacePath, snapshotter },
  };
}

async function writeTerminalResult(
  jobRootDir: string,
  taskId: string,
  handoff: NonNullable<
    Awaited<ReturnType<typeof materializeCodexGoalHandoffArtifacts>>
  >,
  result: TerminalResultOptions = {
    status: "done",
    nextAction: "review_completed",
  },
): Promise<void> {
  await writeFile(
    join(jobRootDir, `${taskId}.latest-result.json`),
    `${JSON.stringify({
      status: result.status,
      ...(result.reason ? { reason: result.reason } : {}),
      changedFiles: handoff.changedPaths,
      evidence: [],
      blockers: [],
      nextAction: result.nextAction,
      artifacts: handoff.artifacts,
      details: { baseCommit: handoff.baseCommit },
    })}\n`,
  );
}

type TerminalResultOptions = {
  readonly status: "done" | "partial";
  readonly reason?: string;
  readonly nextAction: "review_completed" | "preserve_patch";
};

async function actionFixture(
  result: TerminalResultOptions = {
    status: "done",
    nextAction: "review_completed",
  },
) {
  const root = await mkdtemp(
    join(tmpdir(), "subscription-runtime-terminal-recovery-action-"),
  );
  roots.push(root);
  const registryRootDir = join(root, "registry");
  const worktreeRoot = join(root, "worktrees");
  const workspacePath = join(worktreeRoot, "project-worker");
  const canonicalWorkspacePath = join(root, "canonical");
  const jobRootDir = join(root, "jobs", "project-worker");
  const promptPath = join(jobRootDir, "prompt.md");
  const jobId = "project-worker";
  await Promise.all([
    mkdir(workspacePath, { recursive: true }),
    mkdir(canonicalWorkspacePath, { recursive: true }),
    mkdir(jobRootDir, { recursive: true }),
  ]);
  await gitInitRepository(workspacePath);
  await gitInitRepository(canonicalWorkspacePath);
  await writeFile(join(workspacePath, "owned.ts"), "export const value = 1;\n");
  await git(workspacePath, ["add", "owned.ts"]);
  await git(workspacePath, ["commit", "-m", "test: base"]);
  await writeFile(join(workspacePath, "owned.ts"), "export const value = 2;\n");
  await writeFile(promptPath, "Run checks only.\n");
  const handoff = await materializeCodexGoalHandoffArtifacts({
    workerJobId: jobId,
    taskId: jobId,
    workspacePath,
    jobRootDir,
  });
  if (!handoff) throw new Error("expected handoff");
  await writeTerminalResult(jobRootDir, jobId, handoff, result);
  const scope: ProjectAccessScope = {
    projectId: "project",
    workspaceRoots: [canonicalWorkspacePath],
    worktreeRoots: [worktreeRoot],
    registryRoot: registryRootDir,
    jobIdPrefixes: ["project-"],
    tmuxSessionPrefixes: ["project-"],
    allowedAccountIds: ["account-a"],
    allowedBranches: ["main"],
    allowedGitRemotes: ["origin"],
  };
  await createCodexGoalJob({
    registryRootDir,
    manifest: {
      jobId,
      jobRootDir,
      authRootDir: join(root, "auth"),
      workspacePath,
      promptPath,
      taskId: jobId,
      accounts: ["account-a"],
      tmuxSession: jobId,
      accessBoundary: AccessBoundary.ProjectScopedControl,
      projectAccessScope: scope,
      networkAccess: NetworkAccessMode.Restricted,
    },
  });
  const controller = {
    schemaVersion: 1,
    jobId: "project-controller",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z",
    jobRootDir: join(root, "jobs", "project-controller"),
    workspacePath: canonicalWorkspacePath,
    promptPath: join(root, "jobs", "project-controller", "prompt.md"),
    taskId: "project-controller",
    accounts: ["account-a"],
    accessBoundary: AccessBoundary.ProjectScopedControl,
    projectAccessScope: scope,
  } as CodexGoalJobManifest;
  return {
    registryRootDir,
    workspacePath,
    jobRootDir,
    jobId,
    startArgs: {
      registryRootDir,
      controllerJobId: controller.jobId,
      jobId,
      confirmStart: true,
      forceStart: true,
      dependencyBootstrap: "install" as const,
      confirmDependencyBootstrap: true,
    },
    deps: (
      duringBootstrap: () => Promise<void>,
      onStart?: (
        input: { readonly startAdmissionWorkspaceMode?: string },
        request: { readonly workerRole?: string },
      ) => void,
    ) => ({
      loadProjectControlController: async () => ({
        registryRootDir,
        controller,
        scope,
      }),
      loadJobLaunch: async () => {
        throw new Error("unexpected loadJobLaunch");
      },
      codexProjectControlBroker: (
        input: Parameters<
          CodexGoalMcpProjectControlActionsDeps["codexProjectControlBroker"]
        >[0],
      ) => {
        if (!onStart) throw new Error("unexpected broker start");
        return {
          startWorker: async (request: { readonly workerRole?: string }) => {
            onStart(input, request);
            return { status: "started" };
          },
        } as unknown as ProjectControlBroker;
      },
      dependencyBootstrap: async () => {
        await duringBootstrap();
        return {
          mode: "install" as const,
          workspacePath,
          nodeModulesPath: join(workspacePath, "node_modules"),
          nodeModulesExists: true,
          binaryChecks: [],
          fingerprintInputs: [],
          status: "installed" as const,
          warnings: [],
        };
      },
    }),
  };
}
