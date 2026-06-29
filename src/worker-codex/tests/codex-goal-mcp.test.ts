import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { LocalFileWorkerAccountCapacityStore } from "@vioxen/subscription-runtime/store-local-file";
import {
  buildCodexGoalBrief,
  createCodexGoalMcpServer,
} from "../codex-goal-mcp";

const execFileAsync = promisify(execFile);

describe("codex goal MCP server", () => {
  it("flags alive workers with stale logs as silent-stale", async () => {
    const root = await mkdtemp(join(tmpdir(), "subscription-runtime-silent-stale-"));
    const logPath = join(root, "task.log");
    const promptPath = join(root, "prompt.md");
    const staleLogTime = new Date(Date.now() - 10_000);
    try {
      await writeFile(logPath, "");
      await writeFile(promptPath, "Do a sandbox task.\n");
      await utimes(logPath, staleLogTime, staleLogTime);

      const brief = await buildCodexGoalBrief({
        jobId: "job-silent-stale",
        launch: {
          cwd: root,
          logPath,
          cliCommand: ["subscription-runtime-codex-goal"],
          config: {
            jobRootDir: root,
            authRootDir: root,
            workspacePath: root,
            promptPath,
            taskId: "task",
            accounts: [{ name: "account-a" }],
          },
        },
        status: {
          tmuxAlive: true,
          resultExists: false,
          workspaceDirty: false,
          changedFiles: [],
          logPath,
          logExists: true,
          logUpdatedAt: staleLogTime.toISOString(),
          logByteLength: 0,
          recommendedAction: "wait_for_worker",
          warnings: [],
        },
        accounts: [{
          name: "account-a",
          authJsonPath: join(root, "account-a", "auth.json"),
          status: "ready",
          warnings: [],
          safeMessage: "account-a is ready",
        }],
        staleAfterMs: 1_000,
        tailLines: 20,
      });

      expect(brief).toMatchObject({
        isStale: true,
        silentStale: true,
        logByteLength: 0,
        safeToContinue: false,
        nextBestTool: "manual_review",
        nextBestReason: "silent_stale_worker",
        nextBestCommand: "manual_review_silent_stale_worker",
      });
      expect(String(brief.text)).toContain("silentStale true");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("records an audit event when stopping a sandbox tmux worker", async () => {
    if (!(await hasTmux())) return;
    const root = await mkdtemp(join(tmpdir(), "subscription-runtime-stop-event-"));
    const registryRootDir = join(root, "registry");
    const jobRootDir = join(root, "job");
    const stateRootDir = join(root, "state");
    const authRootDir = join(root, "auth");
    const workspacePath = join(root, "workspace");
    const promptPath = join(jobRootDir, "prompt.md");
    const taskId = "sandbox-stop-task";
    const tmuxSession = `subscription-runtime-stop-${process.pid}-${Date.now()}`;

    try {
      await mkdir(jobRootDir, { recursive: true });
      await mkdir(workspacePath, { recursive: true });
      await execFileAsync("git", ["init"], { cwd: workspacePath });
      await writeFile(promptPath, "Do a sandbox task.\n");
      await writeFakeAuth(authRootDir, "account-a", {
        lastRefresh: "2026-06-03T00:00:00.000Z",
      });
      await execFileAsync("tmux", [
        "new-session",
        "-d",
        "-s",
        tmuxSession,
        "-c",
        root,
        "sleep 300",
      ]);

      const server = createCodexGoalMcpServer();
      const client = new Client({ name: "subscription-runtime-test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      try {
        await callToolJson(client, "codex_goal_create_job", {
          registryRootDir,
          jobId: "job-stop",
          jobRootDir,
          authRootDir,
          stateRootDir,
          workspacePath,
          promptPath,
          taskId,
          accounts: ["account-a"],
          logPath: join(jobRootDir, `${taskId}.log`),
          tmuxSession,
        });

        const stopped = await callToolJson(client, "codex_goal_stop", {
          registryRootDir,
          jobId: "job-stop",
          confirmStop: true,
          forceStop: true,
        });

        expect(stopped).toMatchObject({
          ok: true,
          mode: "stop",
          jobId: "job-stop",
          tmuxSession,
        });
        const stopEventPath = String(stopped.stopEventPath);
        expect(stopEventPath).toContain(`${taskId}.stop-event.json`);
        const stopEvent = JSON.parse(await readFile(stopEventPath, "utf8"));
        expect(stopEvent).toMatchObject({
          schemaVersion: 1,
          jobId: "job-stop",
          taskId,
          tmuxSession,
          forceStop: true,
          reason: "manual_force_stop",
        });
        expect(JSON.stringify(stopEvent)).not.toContain("refresh-secret");
        expect(JSON.stringify(stopEvent)).not.toContain("access-secret");
      } finally {
        await client.close();
        await server.close();
      }
    } finally {
      await execFileAsync("tmux", ["kill-session", "-t", tmuxSession]).catch(() => undefined);
      await rm(root, { recursive: true, force: true });
    }
  });

  it("blocks overview continuation hints when multiple jobs share one workspace", async () => {
    const root = await mkdtemp(join(tmpdir(), "subscription-runtime-workspace-conflict-"));
    const registryRootDir = join(root, "registry");
    const authRootDir = join(root, "auth");
    const workspacePath = join(root, "workspace");
    const jobRootA = join(root, "job-a");
    const jobRootB = join(root, "job-b");

    try {
      await mkdir(jobRootA, { recursive: true });
      await mkdir(jobRootB, { recursive: true });
      await mkdir(workspacePath, { recursive: true });
      await execFileAsync("git", ["init"], { cwd: workspacePath });
      await writeFile(join(jobRootA, "prompt.md"), "Do sandbox task A.\n");
      await writeFile(join(jobRootB, "prompt.md"), "Do sandbox task B.\n");
      await writeFakeAuth(authRootDir, "account-a", {
        lastRefresh: "2026-06-03T00:00:00.000Z",
      });

      const server = createCodexGoalMcpServer();
      const client = new Client({ name: "subscription-runtime-test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      try {
        for (const [jobId, jobRootDir, taskId] of [
          ["job-a", jobRootA, "task-a"],
          ["job-b", jobRootB, "task-b"],
        ] as const) {
          await callToolJson(client, "codex_goal_create_job", {
            registryRootDir,
            jobId,
            jobRootDir,
            authRootDir,
            workspacePath,
            promptPath: join(jobRootDir, "prompt.md"),
            taskId,
            accounts: ["account-a"],
            tmuxSession: `${jobId}-worker`,
          });
        }

        const overview = await callToolJson(client, "codex_goal_overview", {
          registryRootDir,
        });

        expect(overview).toMatchObject({
          ok: true,
          safeToOperate: false,
          summary: {
            workspaceConflicts: 1,
            blockedBySingleWriter: 2,
            safeToContinue: 0,
          },
        });
        expect(overview.workspaceConflicts).toEqual([
          expect.objectContaining({
            workspacePath,
            jobIds: expect.arrayContaining(["job-a", "job-b"]),
            safeToContinueJobIds: expect.arrayContaining(["job-a", "job-b"]),
            reason: "multiple_potential_writers_share_workspace",
          }),
        ]);
        const overviewJobs = overview.jobs as readonly Record<string, unknown>[];
        for (const job of overviewJobs) {
          expect(job).toMatchObject({
            blockedBySingleWriter: true,
            workspaceConflict: true,
            safeToContinue: false,
            nextBestTool: "manual_review",
            nextBestReason: "single_writer_workspace_conflict",
            nextBestCommand: "manual_review_single_writer_workspace_conflict",
          });
          expect((job.commands as Record<string, unknown>).continue).toBeUndefined();
        }
      } finally {
        await client.close();
        await server.close();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("exposes job account tools without requiring manual auth or state paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "subscription-runtime-mcp-"));
    const registryRootDir = join(root, "registry");
    const jobRootDir = join(root, "job");
    const stateRootDir = join(root, "state");
    const poolRootDir = join(root, "auth-pools");
    const authRootDir = join(poolRootDir, "live-codex-auth");
    const workspacePath = join(root, "workspace");
    const promptPath = join(jobRootDir, "prompt.md");
    const taskId = "sandbox-task";

    try {
      await mkdir(jobRootDir, { recursive: true });
      await mkdir(workspacePath, { recursive: true });
      await execFileAsync("git", ["init"], { cwd: workspacePath });
      await writeFile(promptPath, "Do a sandbox task.\n");
      await writeFakeAuth(authRootDir, "account-a", {
        lastRefresh: "2026-06-01T00:00:00.000Z",
      });
      await writeFakeAuth(authRootDir, "account-b", {
        lastRefresh: "2026-06-02T00:00:00.000Z",
      });

      const capacityStore = new LocalFileWorkerAccountCapacityStore({
        rootDir: join(stateRootDir, "worker-account-capacity"),
      });
      const cooldownUntil = new Date(Date.now() + 60_000);
      for (const accountId of ["account-a", "account-b"]) {
        capacityStore.observe({
          accountId,
          observedAt: new Date(),
          capacity: {
            availability: "cooldown",
            reason: "quota_limited",
            cooldownUntil,
          },
        });
      }

      const server = createCodexGoalMcpServer();
      const client = new Client({ name: "subscription-runtime-test", version: "0.0.0" });
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      try {
        await callToolJson(client, "codex_goal_create_job", {
          registryRootDir,
          jobId: "job-a",
          description: "sandbox job",
          jobRootDir,
          authRootDir,
          stateRootDir,
          workspacePath,
          promptPath,
          taskId,
          accounts: ["account-a", "account-b", "account-c"],
          outputPath: join(jobRootDir, `${taskId}.latest-result.json`),
          logPath: join(jobRootDir, `${taskId}.log`),
          model: "gpt-5.5",
          reasoningEffort: "xhigh",
          serviceTier: "fast",
          executionEngine: "app-server-goal",
          taskTimeoutMs: 72 * 60 * 60 * 1000,
          maxAccountCycles: 3,
          requireGitWorkspace: true,
          prewarmOnStart: false,
          tmuxSession: "sandbox-task-worker",
          outputFormat: "json",
        });
        await writeFile(
          join(jobRootDir, `${taskId}.pause-request.json`),
          `${JSON.stringify({
            schemaVersion: 1,
            jobId: "job-a",
            taskId,
            requestedAt: "2026-06-29T10:00:00.000Z",
            mode: "soft_pause_only",
            note: "pause after current audit window",
          })}\n`,
        );
        await writeFile(
          join(jobRootDir, `${taskId}.review.json`),
          `${JSON.stringify({
            schemaVersion: 1,
            jobId: "job-a",
            taskId,
            reviewedAt: "2026-06-29T11:00:00.000Z",
            note: "reviewed sandbox state",
            status: { safe: true, token: "access-secret" },
          })}\n`,
        );

        const job = await callToolJson(client, "codex_goal_get_job", {
          registryRootDir,
          jobId: "job-a",
        });
        expect(job.manifest).toMatchObject({
          model: "gpt-5.5",
          reasoningEffort: "xhigh",
          serviceTier: "fast",
          executionEngine: "app-server-goal",
        });

        const brief = await callToolJson(client, "codex_goal_brief", {
          registryRootDir,
          jobId: "job-a",
        });
        const briefBody = brief.brief as Record<string, unknown>;
        expect(briefBody).toMatchObject({
          safeToContinue: false,
          hasAvailableAccount: false,
          availableDedupedAccounts: [],
          lifecycleMarkerTypes: ["review", "pause_request"],
          nextBestTool: "codex_goal_accounts_status",
        });
        expect(briefBody.lifecycleMarkers).toEqual([
          expect.objectContaining({
            type: "review",
            timestamp: "2026-06-29T11:00:00.000Z",
            note: "reviewed sandbox state",
          }),
          expect.objectContaining({
            type: "pause_request",
            timestamp: "2026-06-29T10:00:00.000Z",
            mode: "soft_pause_only",
          }),
        ]);
        expect(String(briefBody.nextBestCommand)).toContain("codex_goal_accounts_status");
        expect(String(briefBody.nextBestCommand)).toContain("job-a");
        expect(String(briefBody.nextBestCommand)).not.toContain("authRootDir");
        expect(JSON.stringify(brief)).not.toContain("access-secret");

        const overview = await callToolJson(client, "codex_goal_overview", {
          registryRootDir,
        });
        expect(overview).toMatchObject({
          ok: true,
          registryRootDir,
          totalJobs: 1,
          returnedJobs: 1,
          summary: {
            running: 0,
            safeToContinue: 0,
            needsHumanRelogin: 1,
          },
        });
        const overviewJobs = overview.jobs as readonly Record<string, unknown>[];
        expect(overviewJobs[0]).toMatchObject({
          ok: true,
          jobId: "job-a",
          workerAlive: false,
          hasAvailableAccount: false,
          lifecycleMarkerTypes: ["review", "pause_request"],
          nextBestTool: "codex_goal_accounts_status",
        });
        expect(overviewJobs[0]?.lifecycleMarkers).toEqual([
          expect.objectContaining({ type: "review" }),
          expect.objectContaining({ type: "pause_request" }),
        ]);
        expect(String((overviewJobs[0]?.commands as Record<string, unknown>).brief))
          .toContain("registryRootDir");
        expect(JSON.stringify(overview)).not.toContain("refresh-secret");
        expect(JSON.stringify(overview)).not.toContain("access-secret");

        const handoff = await callToolJson(client, "codex_goal_handoff", {
          registryRootDir,
          jobId: "job-a",
        });
        const handoffBody = handoff.handoff as Record<string, unknown>;
        expect(String(handoffBody.text)).toContain("Codex goal handoff: job-a");
        expect(String(handoffBody.text)).toContain("subscription-runtime-codex-goal tool codex_goal_brief");
        expect(String(handoffBody.text)).toContain("Do not run two writer workers");
        expect(String(handoffBody.text)).toContain("lifecycleMarkers: review, pause_request");
        expect(String(handoffBody.text)).not.toContain("refresh-secret");
        expect(String(handoffBody.text)).not.toContain("access-secret");
        expect(String(handoffBody.text)).not.toContain("secret@example.com");
        expect(handoffBody.summary).toMatchObject({
          jobId: "job-a",
          registryRootDir,
          safeToContinue: false,
          hasAvailableAccount: false,
          lifecycleMarkerTypes: ["review", "pause_request"],
        });

        const stop = await callToolJson(client, "codex_goal_stop", {
          registryRootDir,
          jobId: "job-a",
          confirmStop: true,
        });
        expect(stop).toMatchObject({
          ok: false,
          reason: "worker_not_running",
          jobId: "job-a",
          tmuxSession: "sandbox-task-worker",
        });
        expect(String(stop.stopCommand)).toContain("tmux kill-session -t sandbox-task-worker");

        const status = await callToolJson(client, "codex_goal_accounts_status", {
          registryRootDir,
          jobId: "job-a",
        });
        expect(status).toMatchObject({
          ok: false,
          registryRootDir,
          jobId: "job-a",
          authRootDir,
          stateRootDir,
          capacityAware: true,
          availableDedupedAccountNames: [],
        });
        expect(
          (status.slots as readonly { readonly name: string }[]).map((slot) => slot.name),
        ).toEqual(["account-a", "account-b", "account-c"]);
        expect(JSON.stringify(status)).not.toContain("refresh-secret");
        expect(JSON.stringify(status)).not.toContain("access-secret");
        expect(JSON.stringify(status)).not.toContain("secret@example.com");

        const pools = await callToolJson(client, "codex_goal_accounts_list_pools", {
          registryRootDir,
          jobId: "job-a",
        });
        expect(pools).toMatchObject({
          ok: true,
          registryRootDir,
          jobId: "job-a",
          poolRootDir,
          selectedAuthRootDir: authRootDir,
          stateRootDir,
          capacityAware: true,
        });
        expect(pools.pools).toEqual([
          expect.objectContaining({
            pool: "live-codex-auth",
            authRootDir,
            availableCount: 0,
            availableDedupedAccountNames: [],
          }),
        ]);

        const relogin = await callToolJson(
          client,
          "codex_goal_accounts_relogin_instructions",
          {
            registryRootDir,
            jobId: "job-a",
          },
        );
        expect(relogin).toMatchObject({
          ok: true,
          registryRootDir,
          jobId: "job-a",
          authRootDir,
          stateRootDir,
          targetAccounts: ["account-c"],
        });
        const instructionsByAccount = relogin.instructionsByAccount as
          Record<string, readonly string[]>;
        expect(instructionsByAccount["account-c"]).toContainEqual(
          expect.stringContaining("CODEX_HOME="),
        );
        expect(instructionsByAccount["account-c"]).toContainEqual(
          expect.stringContaining("codex_goal_accounts_status"),
        );

        const rawRelogin = await callToolJson(
          client,
          "codex_accounts_relogin_instructions",
          {
            authRootDir,
            account: "account-c",
          },
        );
        expect(rawRelogin.instructions).toContainEqual(
          expect.stringContaining("codex_accounts_status"),
        );
        expect(rawRelogin.instructions).not.toContainEqual(
          expect.stringContaining("codex_goal_accounts_status"),
        );
      } finally {
        await client.close();
        await server.close();
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

async function callToolJson(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const result = await client.callTool({ name, arguments: args });
  const content = (result as { readonly content?: readonly unknown[] }).content;
  const first = content?.[0] as
    | { readonly type?: string; readonly text?: string }
    | undefined;
  if (first?.type !== "text") throw new Error("expected text MCP response");
  return JSON.parse(first.text ?? "{}") as Record<string, unknown>;
}

async function hasTmux(): Promise<boolean> {
  try {
    await execFileAsync("tmux", ["-V"]);
    return true;
  } catch {
    return false;
  }
}

async function writeFakeAuth(
  authRootDir: string,
  account: string,
  options: { readonly lastRefresh: string },
) {
  const accountDir = join(authRootDir, account);
  await mkdir(accountDir, { recursive: true });
  await writeFile(
    join(accountDir, "auth.json"),
    `${JSON.stringify({
      auth_mode: "chatgpt",
      last_refresh: options.lastRefresh,
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
}

function fakeJwt(claims: Readonly<Record<string, unknown>>): string {
  return [
    base64UrlJson({ alg: "none", typ: "JWT" }),
    base64UrlJson(claims),
    "",
  ].join(".");
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64url");
}
