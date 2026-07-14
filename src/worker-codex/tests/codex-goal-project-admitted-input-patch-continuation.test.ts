import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import {
  AccessBoundary,
  NetworkAccessMode,
  type ProjectAccessScope,
} from "@vioxen/subscription-runtime/worker-core";

import type {
  CodexGoalJobManifest,
  CodexGoalJobManifestInput,
} from "../codex-goal-jobs";
import { codexGoalJobManifestPath, readCodexGoalJob } from "../codex-goal-jobs";
import { projectControlStartStoredJobView } from "../codex-goal-mcp-project-control-actions";
import { isAdmittedInputPatchCapacityContinuation } from "../application/project-control/codex-goal-project-admitted-input-patch-continuation";
import {
  planProjectPreStartAdmission,
  prepareProjectPreStartAdmission,
} from "../application/project-control/codex-goal-project-pre-start-admission";
import { authorizeProjectPreStartAdmissionLaunch } from "../application/project-control/codex-goal-project-pre-start-launch-authorization";
import {
  cleanupProjectPreStartAdmissionFixtures,
  createBuiltinFixture,
  withWorkKey,
} from "./codex-goal-project-pre-start-admission-fixture";

afterEach(async () => {
  await cleanupProjectPreStartAdmissionFixtures();
});

describe("admitted input-patch capacity continuation", () => {
  it("recognizes only an evidenced dirty capacity pause", () => {
    const status = {
      workspaceDirty: true,
      recommendedAction: "continue_after_capacity",
      resultStatus: "blocked",
      resultReason: "account_unavailable",
    } as const;
    expect(isAdmittedInputPatchCapacityContinuation(status)).toBe(true);
    expect(
      isAdmittedInputPatchCapacityContinuation({
        ...status,
        workspaceDirty: false,
      }),
    ).toBe(false);
    expect(
      isAdmittedInputPatchCapacityContinuation({
        ...status,
        recommendedAction: "inspect_dirty_failure",
      }),
    ).toBe(false);
    expect(
      isAdmittedInputPatchCapacityContinuation({
        ...status,
        resultReason: "provider_failure",
      }),
    ).toBe(false);
  });

  it("resumes the same admitted patch without reviewed output and rejects drift", async () => {
    const fixture = await createBuiltinFixture();
    const registryRootDir = join(fixture.root, "registry");
    const canonicalWorkspacePath = join(fixture.root, "canonical");
    const worktreeRoot = join(fixture.root, "worktrees");
    const workspacePath = join(worktreeRoot, fixture.manifest.jobId);
    await mkdir(canonicalWorkspacePath, { recursive: true });
    execFileSync("git", ["init", "--quiet"], {
      cwd: canonicalWorkspacePath,
    });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: canonicalWorkspacePath,
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: canonicalWorkspacePath,
    });
    await writeFile(join(canonicalWorkspacePath, "README.md"), "canonical\n");
    execFileSync("git", ["add", "."], { cwd: canonicalWorkspacePath });
    execFileSync("git", ["commit", "--quiet", "-m", "test: canonical"], {
      cwd: canonicalWorkspacePath,
    });

    await mkdir(worktreeRoot, { recursive: true });
    execFileSync("git", [
      "clone",
      "--quiet",
      fixture.workspacePath,
      workspacePath,
    ]);
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: workspacePath,
    });
    execFileSync("git", ["config", "user.name", "Test"], {
      cwd: workspacePath,
    });
    await mkdir(join(workspacePath, "src"), { recursive: true });
    await writeFile(
      join(workspacePath, "src", "example.ts"),
      "export const value = 1;\n",
    );
    execFileSync("git", ["add", "src/example.ts"], { cwd: workspacePath });
    const stagedPatch = execFileSync(
      "git",
      ["diff", "--cached", "--binary", "--no-ext-diff"],
      { cwd: workspacePath },
    );
    const patchSha256 = sha256(stagedPatch);

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
      preStartAdmission: { required: true, mode: "serial-builtin" },
    };
    const manifestInput: CodexGoalJobManifestInput = {
      jobId: fixture.manifest.jobId,
      jobRootDir: fixture.manifest.jobRootDir,
      workspacePath,
      promptPath: fixture.manifest.promptPath,
      taskId: fixture.manifest.taskId,
      accounts: fixture.manifest.accounts,
      authRootDir: join(fixture.root, "auth"),
      tmuxSession: fixture.manifest.jobId,
      accessBoundary: AccessBoundary.IsolatedWorkspaceWrite,
      networkAccess: NetworkAccessMode.Restricted,
    };
    const contract = withWorkKey({
      ...fixture.contract,
      workspaceRoot: workspacePath,
      phaseStartSha: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: workspacePath,
        encoding: "utf8",
      }).trim(),
      canonicalSha: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: workspacePath,
        encoding: "utf8",
      }).trim(),
      baseSha: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: workspacePath,
        encoding: "utf8",
      }).trim(),
      inputPatchHash: patchSha256,
      reviewKind: "review",
      ownedPaths: ["src/example.ts"],
      executionPolicy: {
        mode: "sandbox-only",
        sandboxRoot: workspacePath,
        forbiddenRealProjects: [join(fixture.root, "forbidden-project")],
      },
    });
    const state = {
      ...fixture.state,
      records: fixture.state.records.map((record) => ({
        ...record,
        ...Object.fromEntries(
          (
            [
              "workKey",
              "baseSha",
              "phaseStartSha",
              "inputPatchHash",
              "reviewKind",
            ] as const
          ).map((field) => [field, contract[field]]),
        ),
      })),
    };
    const plan = planProjectPreStartAdmission({
      value: { mode: "serial-builtin", contract, state },
      confirmed: true,
      scope,
      manifest: manifestInput,
    });
    if (!plan) throw new Error("expected admission plan");
    const manifestDefinition: CodexGoalJobManifest = {
      ...manifestInput,
      schemaVersion: 1,
      createdAt: "2026-07-14T00:00:00.000Z",
      updatedAt: "2026-07-14T00:00:00.000Z",
      projectPreStartAdmission: plan.descriptor,
    };
    const manifestPath = codexGoalJobManifestPath({
      registryRootDir,
      jobId: manifestDefinition.jobId,
    });
    await mkdir(join(registryRootDir, manifestDefinition.jobId), {
      recursive: true,
    });
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifestDefinition, null, 2)}\n`,
    );
    const manifest = await readCodexGoalJob({
      registryRootDir,
      jobId: manifestDefinition.jobId,
    });
    await prepareProjectPreStartAdmission({
      plan,
      manifest,
      scope,
      verifiedInputPatchArtifactSha256: patchSha256,
      verifiedInputPatchStagedSha256: patchSha256,
    });
    await authorizeProjectPreStartAdmissionLaunch({ manifest, scope });
    await writeFile(
      join(manifest.jobRootDir, `${manifest.taskId}.latest-result.json`),
      `${JSON.stringify({
        status: "blocked",
        reason: "account_unavailable",
        changedFiles: [],
        evidence: ["safe_execution_status:waiting_capacity"],
        blockers: ["account_unavailable"],
        nextAction: "wait",
      })}\n`,
    );

    const controller = {
      schemaVersion: 1,
      jobId: "project-controller",
      createdAt: "2026-07-14T00:00:00.000Z",
      updatedAt: "2026-07-14T00:00:00.000Z",
      jobRootDir: join(fixture.root, "jobs", "project-controller"),
      workspacePath: canonicalWorkspacePath,
      promptPath: join(fixture.root, "jobs", "project-controller", "prompt.md"),
      taskId: "project-controller",
      accounts: ["account-a"],
      accessBoundary: AccessBoundary.ProjectScopedControl,
      projectAccessScope: scope,
    } as CodexGoalJobManifest;
    let bootstrapCalls = 0;
    const deps = {
      loadProjectControlController: async () => ({
        registryRootDir,
        controller,
        scope,
      }),
      loadJobLaunch: async () => {
        throw new Error("unexpected_load_job_launch");
      },
      codexProjectControlBroker: () => {
        throw new Error("unexpected_broker_start");
      },
      dependencyBootstrap: async () => {
        bootstrapCalls += 1;
        throw new Error("reached_dependency_bootstrap");
      },
    };
    const args = {
      registryRootDir,
      controllerJobId: controller.jobId,
      jobId: manifest.jobId,
      confirmStart: true,
    };
    await expect(projectControlStartStoredJobView(args, deps)).rejects.toThrow(
      "reached_dependency_bootstrap",
    );
    expect(bootstrapCalls).toBe(1);

    await writeFile(join(workspacePath, "UNTRACKED.txt"), "drift\n");
    await expect(projectControlStartStoredJobView(args, deps)).rejects.toThrow(
      "project_control_pre_start_launch_binding_mismatch",
    );
    expect(bootstrapCalls).toBe(1);
    expect(await readFile(plan.descriptor.receiptPath, "utf8")).toContain(
      '"status": "launch_authorized"',
    );
  });
});

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
