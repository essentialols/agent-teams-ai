import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { gitWorkspaceStatus } from "../codex-goal-status-files";

const execFileAsync = promisify(execFile);
const cleanup: string[] = [];

describe("Codex goal workspace status", () => {
  afterEach(async () => {
    await Promise.all(cleanup.splice(0).map((path) =>
      rm(path, { recursive: true, force: true })
    ));
  });

  it("reports exact nested untracked file paths", async () => {
    const workspacePath = await mkdtemp(join(tmpdir(), "codex-goal-status-"));
    cleanup.push(workspacePath);
    await execFileAsync("git", ["init"], { cwd: workspacePath });
    await mkdir(join(workspacePath, "nested"));
    await writeFile(join(workspacePath, "nested", "untracked.ts"), "export {};\n");

    await expect(gitWorkspaceStatus(workspacePath)).resolves.toMatchObject({
      exists: true,
      dirty: true,
      changedFiles: ["nested/untracked.ts"],
    });
  });
});
