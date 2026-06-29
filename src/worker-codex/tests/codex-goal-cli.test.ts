import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildNoTmuxShellCommand,
  buildTmuxCommand,
  parseCodexGoalCliArgs,
  runCodexGoalCli,
  type CodexGoalCliIo,
} from "../codex-goal-cli";

describe("codex goal cli", () => {
  it("builds a run command from flags with safe defaults", () => {
    const command = parseCodexGoalCliArgs(
      [
        "run",
        "--job-root",
        "/tmp/job",
        "--auth-root",
        "/tmp/auth",
        "--workspace",
        "/tmp/workspace",
        "--prompt",
        "/tmp/job/prompt.md",
        "--task-id",
        "task-1",
        "--accounts",
        "account-a,account-b",
        "--tmux-session",
        "goal-worker",
      ],
      fakeIo(),
    );

    expect(command.kind).toBe("run");
    if (command.kind !== "run") return;
    expect(command.config).toMatchObject({
      jobRootDir: "/tmp/job",
      authRootDir: "/tmp/auth",
      workspacePath: "/tmp/workspace",
      promptPath: "/tmp/job/prompt.md",
      taskId: "task-1",
      model: "gpt-5.5",
      reasoningEffort: "xhigh",
      serviceTier: "fast",
      taskTimeoutMs: 72 * 60 * 60 * 1000,
      maxAccountCycles: 3,
      requireGitWorkspace: true,
    });
    expect(command.config.accounts.map((account) => account.name)).toEqual([
      "account-a",
      "account-b",
    ]);
    expect(command.tmuxSession).toBe("goal-worker");
  });

  it("uses environment fallback names for continuation handoff", () => {
    const command = parseCodexGoalCliArgs(
      [
        "continue",
        "--job-root",
        "/tmp/job",
        "--auth-root",
        "/tmp/auth",
        "--accounts",
        "account-c",
        "--no-require-git-workspace",
      ],
      fakeIo({
        SUBSCRIPTION_RUNTIME_TASK_ID: "task-env",
        SUBSCRIPTION_RUNTIME_WORKSPACE_PATH: "/tmp/workspace-env",
        SUBSCRIPTION_RUNTIME_PROMPT_PATH: "/tmp/job/prompt-env.md",
        CODEX_MODEL: "gpt-test",
        CODEX_REASONING_EFFORT: "high",
        CODEX_SERVICE_TIER: "default",
      }),
    );

    expect(command.kind).toBe("run");
    if (command.kind !== "run") return;
    expect(command.config).toMatchObject({
      taskId: "task-env",
      workspacePath: "/tmp/workspace-env",
      promptPath: "/tmp/job/prompt-env.md",
      model: "gpt-test",
      reasoningEffort: "high",
      serviceTier: "default",
      requireGitWorkspace: false,
    });
  });

  it("renders no-tmux and tmux commands without hiding manual control", () => {
    const command = parseCodexGoalCliArgs(
      [
        "run",
        "--job-root",
        "/tmp/job",
        "--auth-root",
        "/tmp/auth",
        "--workspace",
        "/tmp/workspace",
        "--prompt",
        "/tmp/job/prompt.md",
        "--task-id",
        "task-1",
        "--accounts",
        "account-a,account-b",
        "--tmux-session",
        "goal-worker",
        "--dry-run",
      ],
      fakeIo(),
    );

    expect(command.kind).toBe("run");
    if (command.kind !== "run") return;
    const noTmux = buildNoTmuxShellCommand(command);
    expect(noTmux).toContain("run --no-tmux");
    expect(noTmux).toContain("--accounts account-a,account-b");
    expect(noTmux).toContain("--effort xhigh");
    expect(noTmux).toContain("--service-tier fast");

    const tmux = buildTmuxCommand(command);
    expect(tmux.args).toEqual(
      expect.arrayContaining(["new-session", "-d", "-s", "goal-worker"]),
    );
    expect(tmux.preview).toContain("tmux new-session");
    expect(tmux.preview).toContain("tee -a /tmp/job/task-1.log");
  });

  it("exposes the full MCP tool surface through the CLI fallback", async () => {
    const io = captureIo();

    const exitCode = await runCodexGoalCli(["tools"], io);

    expect(exitCode).toBe(0);
    const output = JSON.parse(io.stdout);
    expect(output.tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "codex_goal_brief" }),
        expect.objectContaining({ name: "codex_goal_accounts_status" }),
        expect.objectContaining({ name: "codex_goal_continue" }),
      ]),
    );
  });

  it("calls MCP job tools through the CLI fallback with JSON args", async () => {
    const root = await mkdtemp(join(tmpdir(), "subscription-runtime-cli-mcp-"));
    const io = captureIo();

    try {
      const exitCode = await runCodexGoalCli([
        "tool",
        "codex_goal_list_jobs",
        "--args-json",
        JSON.stringify({ registryRootDir: root }),
      ], io);

      expect(exitCode).toBe(0);
      expect(JSON.parse(io.stdout)).toMatchObject({
        ok: true,
        registryRootDir: root,
        jobs: [],
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function fakeIo(
  env: Readonly<Record<string, string | undefined>> = {},
): CodexGoalCliIo {
  return {
    writeStdout(): void {},
    writeStderr(): void {},
    cwd(): string {
      return "/tmp";
    },
    env(): Readonly<Record<string, string | undefined>> {
      return env;
    },
  };
}

function captureIo(
  env: Readonly<Record<string, string | undefined>> = {},
): CodexGoalCliIo & {
  readonly stdout: string;
  readonly stderr: string;
} {
  let stdout = "";
  let stderr = "";
  return {
    writeStdout(chunk): void {
      stdout += chunk;
    },
    writeStderr(chunk): void {
      stderr += chunk;
    },
    cwd(): string {
      return "/tmp";
    },
    env(): Readonly<Record<string, string | undefined>> {
      return env;
    },
    get stdout(): string {
      return stdout;
    },
    get stderr(): string {
      return stderr;
    },
  };
}
