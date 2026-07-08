import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { SafeExecutionError } from "../domain/safe-execution-policy";
import type {
  TaskRunId,
  WorkspaceLockHandle,
  WorkspaceLockRecord,
} from "../domain/safe-execution-task";
import type { WorkspaceLockStore } from "../ports/safe-execution-ports";
import { canonicalWorkspacePath } from "../application/safe-execution-workspace";
import { atomicWriteJson } from "./file-json";
import {
  canReplaceLock,
  isNodeErrorCode,
  workspaceLockedError,
  workspaceLockKey,
} from "./workspace-locking";

export class LocalFileWorkspaceLockStore implements WorkspaceLockStore {
  constructor(private readonly rootDir: string) {}

  async acquire(input: {
    readonly taskId: TaskRunId;
    readonly workspacePath: string;
    readonly ownerId: string;
    readonly ownerPid?: number;
    readonly staleLockMs?: number;
    readonly now?: Date;
  }): Promise<WorkspaceLockHandle> {
    const workspacePath = await canonicalWorkspacePath(input.workspacePath);
    const key = workspaceLockKey(workspacePath);
    const lockDir = join(this.rootDir, "workspace-locks", key);
    const lockFile = join(lockDir, "lock.json");
    const now = input.now ?? new Date();
    await mkdir(dirname(lockDir), { recursive: true, mode: 0o700 });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await mkdir(lockDir, { mode: 0o700 });
        const record: WorkspaceLockRecord = {
          taskId: input.taskId,
          workspacePath,
          ownerId: input.ownerId,
          ...(input.ownerPid === undefined ? {} : { ownerPid: input.ownerPid }),
          acquiredAt: now,
          ...(input.staleLockMs === undefined
            ? {}
            : { staleLockMs: input.staleLockMs }),
        };
        await atomicWriteJson(lockFile, serializeLockRecord(record));
        return {
          ...record,
          release: async () => {
            await releaseFileLock(lockDir, lockFile, record);
          },
        };
      } catch (error) {
        if (!isNodeErrorCode(error, "EEXIST")) throw error;
        const existing = await readLockRecord(lockFile, workspacePath);
        if (existing && canReplaceLock(existing, now)) {
          await rm(lockDir, { recursive: true, force: true });
          continue;
        }
        throw workspaceLockedError(existing ?? {
          taskId: "unknown",
          workspacePath,
          ownerId: "unknown",
          acquiredAt: now,
        });
      }
    }

    throw new SafeExecutionError(
      "safe_execution_workspace_locked",
      "Workspace lock could not be acquired after stale cleanup.",
      { details: { workspacePath } },
    );
  }
}

async function releaseFileLock(
  lockDir: string,
  lockFile: string,
  record: WorkspaceLockRecord,
): Promise<void> {
  const current = await readLockRecord(lockFile, record.workspacePath).catch(
    () => null,
  );
  if (current?.ownerId === record.ownerId && current.taskId === record.taskId) {
    await rm(lockDir, { recursive: true, force: true });
  }
}

async function readLockRecord(
  path: string,
  fallbackWorkspacePath: string,
): Promise<WorkspaceLockRecord | null> {
  try {
    const raw = JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
    const ownerPid = numberValue(raw.ownerPid);
    const staleLockMs = numberValue(raw.staleLockMs);
    return {
      taskId: stringValue(raw.taskId) ?? "unknown",
      workspacePath: stringValue(raw.workspacePath) ?? fallbackWorkspacePath,
      ownerId: stringValue(raw.ownerId) ?? "unknown",
      ...(ownerPid === undefined ? {} : { ownerPid }),
      acquiredAt: dateValue(raw.acquiredAt) ?? new Date(0),
      ...(staleLockMs === undefined ? {} : { staleLockMs }),
    };
  } catch (error) {
    if (isNodeErrorCode(error, "ENOENT")) return null;
    throw error;
  }
}

function serializeLockRecord(
  record: WorkspaceLockRecord,
): Readonly<Record<string, unknown>> {
  return {
    taskId: record.taskId,
    workspacePath: record.workspacePath,
    ownerId: record.ownerId,
    ownerPid: record.ownerPid,
    acquiredAt: record.acquiredAt.toISOString(),
    staleLockMs: record.staleLockMs,
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
