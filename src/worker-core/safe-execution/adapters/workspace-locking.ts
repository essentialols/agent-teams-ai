import {
  SafeExecutionError,
  shouldReplaceSafeExecutionWorkspaceLock,
} from "../domain/safe-execution-policy";
import type { WorkspaceLockRecord } from "../domain/safe-execution-task";
import { hashText } from "../application/safe-execution-workspace";

export function workspaceLockKey(workspacePath: string): string {
  return hashText(workspacePath);
}

export function canReplaceLock(record: WorkspaceLockRecord, now: Date): boolean {
  const ownerProcessAlive =
    record.ownerPid === undefined ? undefined : isProcessAlive(record.ownerPid);
  return shouldReplaceSafeExecutionWorkspaceLock({
    acquiredAt: record.acquiredAt,
    now,
    ...(record.staleLockMs === undefined
      ? {}
      : { staleLockMs: record.staleLockMs }),
    ...(record.ownerPid === undefined ? {} : { ownerPid: record.ownerPid }),
    ...(ownerProcessAlive === undefined ? {} : { ownerProcessAlive }),
  });
}

export function workspaceLockedError(
  record: WorkspaceLockRecord,
): SafeExecutionError {
  return new SafeExecutionError(
    "safe_execution_workspace_locked",
    "Workspace is already locked by another safe execution task.",
    {
      details: {
        taskId: record.taskId,
        workspacePath: record.workspacePath,
        ownerId: record.ownerId,
        ...(record.ownerPid === undefined
          ? {}
          : { ownerPid: String(record.ownerPid) }),
        acquiredAt: record.acquiredAt.toISOString(),
      },
    },
  );
}

export function sameWorkspaceLock(
  left: WorkspaceLockRecord,
  right: WorkspaceLockRecord,
): boolean {
  return (
    left.taskId === right.taskId &&
    left.workspacePath === right.workspacePath &&
    left.ownerId === right.ownerId &&
    left.ownerPid === right.ownerPid &&
    left.acquiredAt.getTime() === right.acquiredAt.getTime() &&
    left.staleLockMs === right.staleLockMs
  );
}

export function isNodeErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (isNodeErrorCode(error, "ESRCH")) return false;
    return true;
  }
}
