import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { LocalFileWorkerAccountCapacityStore } from "@vioxen/subscription-runtime/store-local-file";
import { RunObservationService } from "@vioxen/subscription-runtime/worker-core";
import { createCodexGoalJob, type CodexGoalJobManifestInput } from "../codex-goal-jobs";
import { CodexRunObservationAdapter } from "../codex-run-observation";

const execFileAsync = promisify(execFile);

describe("CodexRunObservationAdapter", () => {
  it("normalizes stored Codex goal sources into a read-only run snapshot", async () => {
    const fixture = await createObservationFixture();
    const cooldownUntil = new Date(Date.now() + 60_000);
    new LocalFileWorkerAccountCapacityStore({
      rootDir: join(fixture.root, "state", "worker-account-capacity"),
    }).observe({
      accountId: "account-a",
      observedAt: new Date(),
      capacity: {
        availability: "cooldown",
        reason: "quota_limited",
        cooldownUntil,
      },
    });

    try {
      await writeFile(fixture.manifest.outputPath!, `${JSON.stringify({
        status: "partial",
        reason: "quota_limited",
        task: { updatedAt: "2026-06-30T00:00:00.000Z" },
      })}\n`);
      await writeFile(fixture.manifest.progressPath!, `${JSON.stringify({
        schemaVersion: 1,
        taskId: fixture.manifest.taskId,
        status: "running",
        updatedAt: new Date().toISOString(),
        pid: 12345,
        attemptCount: 2,
        currentAccount: "account-a",
      })}\n`);
      await writeFile(
        fixture.manifest.logPath!,
        [
          "$ npm test",
          "Authorization: Bearer rawBearerSecret",
          "python script.py token=raw-secret",
        ].join("\n"),
      );
      await writeFile(join(fixture.manifest.workspacePath, "changed.txt"), "dirty\n");

      const service = new RunObservationService(new CodexRunObservationAdapter({
        registryRootDir: fixture.registryRootDir,
        staleAfterMs: 60_000,
      }), {
        clock: { now: () => new Date("2026-06-30T00:01:00.000Z") },
      });
      const [snapshot] = await service.observeRuns({
        includeChangedFiles: true,
        includeLogTail: true,
        tailLines: 10,
      });

      expect(snapshot).toMatchObject({
        runId: "job-a",
        providerKind: "codex",
        status: "failed",
        workspace: {
          dirty: true,
          changedFilesCount: 1,
        },
        process: {
          pid: 12345,
        },
        progress: {
          status: "running",
          attemptCount: 2,
          currentAccount: "account-a",
        },
        result: {
          exists: true,
          status: "partial",
          reason: "quota_limited",
        },
        capacity: [{
          account: "account-a",
          availability: "cooldown",
          reason: "quota_limited",
          cooldownUntil: cooldownUntil.toISOString(),
        }],
        readOnlyDecision: {
          kind: "unsafe_state_mismatch",
          reason: "stopped_run_with_running_progress",
        },
      });
      expect(snapshot?.workspace?.changedFiles).toEqual(["?? changed.txt"]);
      expect(snapshot?.logs?.tail).toContain("npm test");
      expect(JSON.stringify(snapshot).includes("rawBearerSecret")).toBe(false);
      expect(JSON.stringify(snapshot).includes("raw-secret")).toBe(false);
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  it("surfaces completed results without prescribing control actions", async () => {
    const fixture = await createObservationFixture();

    try {
      await writeFile(fixture.manifest.outputPath!, `${JSON.stringify({
        status: "completed",
        task: { updatedAt: "2026-06-30T00:00:00.000Z" },
      })}\n`);

      const snapshot = await new RunObservationService(new CodexRunObservationAdapter({
        registryRootDir: fixture.registryRootDir,
      })).observeRun({ runId: "job-a" });

      expect(snapshot).toMatchObject({
        runId: "job-a",
        status: "completed",
        readOnlyDecision: {
          kind: "review_completed",
        },
      });
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });
});

async function createObservationFixture(): Promise<{
  readonly root: string;
  readonly registryRootDir: string;
  readonly manifest: CodexGoalJobManifestInput;
}> {
  const root = await mkdtemp(join(tmpdir(), "subscription-runtime-observe-"));
  const registryRootDir = join(root, "registry");
  const jobRootDir = join(root, "job");
  const authRootDir = join(root, "auth");
  const workspacePath = join(root, "workspace");
  await mkdir(join(authRootDir, "account-a"), { recursive: true });
  await mkdir(jobRootDir, { recursive: true });
  await mkdir(workspacePath, { recursive: true });
  await execFileAsync("git", ["init"], { cwd: workspacePath });
  await writeFile(join(jobRootDir, "prompt.md"), "Observe this sandbox job.\n");
  await writeFile(
    join(authRootDir, "account-a", "auth.json"),
    `${JSON.stringify({
      auth_mode: "chatgpt",
      last_refresh: new Date().toISOString(),
      tokens: {
        refresh_token: "refresh-secret",
        access_token: "access-secret",
        id_token: fakeJwt({
          email: "secret@example.com",
          sub: "oauth-sub-secret",
          "https://api.openai.com/auth": {
            chatgpt_account_id: "chatgpt-account-secret",
            chatgpt_user_id: "chatgpt-user-secret",
          },
        }),
        expiry: Math.floor(Date.now() / 1000) + 3600,
      },
    })}\n`,
  );
  const manifest: CodexGoalJobManifestInput = {
    jobId: "job-a",
    description: "sandbox observation job",
    jobRootDir,
    authRootDir,
    stateRootDir: join(root, "state"),
    workspacePath,
    promptPath: join(jobRootDir, "prompt.md"),
    taskId: "task-a",
    accounts: ["account-a"],
    outputPath: join(jobRootDir, "task-a.latest-result.json"),
    progressPath: join(jobRootDir, "task-a.progress.json"),
    logPath: join(jobRootDir, "task-a.log"),
    cwd: root,
    requireGitWorkspace: true,
  };
  await createCodexGoalJob({
    registryRootDir,
    manifest,
    now: new Date("2026-06-30T00:00:00.000Z"),
  });
  return { root, registryRootDir, manifest };
}

function fakeJwt(claims: Readonly<Record<string, unknown>>): string {
  return [
    base64UrlJson({ alg: "none", typ: "JWT" }),
    base64UrlJson(claims),
    "",
  ].join(".");
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
