import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { promisify } from "node:util";
import { SafeExecutionError } from "../domain/safe-execution-policy";
import type { WorkspaceRunId } from "../domain/safe-execution-task";

const execFileAsync = promisify(execFile);

export async function canonicalWorkspacePath(path: string): Promise<string> {
  const resolved = resolve(path);
  return realpath(resolved).catch(() => resolved);
}

export async function assertGitWorkspace(workspacePath: string): Promise<void> {
  const result = await execFileAsync("git", [
    "rev-parse",
    "--is-inside-work-tree",
  ], {
    cwd: workspacePath,
    timeout: 5_000,
  }).catch(() => null);
  if (result?.stdout.toString().trim() === "true") return;
  throw new SafeExecutionError(
    "safe_execution_workspace_not_git",
    "Safe execution requires a git worktree workspace.",
    { details: { workspacePath } },
  );
}

export function workspaceRunId(workspacePath: string): WorkspaceRunId {
  return `workspace:${hashText(workspacePath).slice(0, 24)}`;
}

export function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeRelativePath(path: string): string {
  return path.split(sep).join("/");
}

export const systemClock = {
  now(): Date {
    return new Date();
  },
};
