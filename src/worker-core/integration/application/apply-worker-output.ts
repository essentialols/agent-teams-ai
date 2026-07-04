import {
  assertFilesWithinExpected,
  markWorkerOutputApplied,
  normalizeProjectRelativePath,
  type IntegrationAttempt,
} from "../domain/integration-attempt";
import {
  IntegrationError,
  IntegrationErrorReason,
} from "../domain/integration-errors";
import { IntegrationAuditEventType } from "../domain/integration-events";
import type { GitPort } from "../ports/git-port";
import type { WorkspaceLockPort } from "../ports/workspace-lock-port";
import {
  loadIntegrationAttempt,
  nowIso,
  recordIntegrationAudit,
  type IntegrationUseCaseDeps,
} from "./common";

export type ApplyWorkerOutputDeps = IntegrationUseCaseDeps & {
  readonly git: GitPort;
  readonly locks: WorkspaceLockPort;
};

export type ApplyWorkerOutputInput = {
  readonly attemptId: string;
  readonly allowedPreExistingDirtyFiles?: readonly string[];
};

export async function applyWorkerOutput(
  deps: ApplyWorkerOutputDeps,
  input: ApplyWorkerOutputInput,
): Promise<IntegrationAttempt> {
  const attempt = await loadIntegrationAttempt(deps.store, input.attemptId);
  const lock = await deps.locks.acquire({
    workspacePath: attempt.targetWorkspacePath,
    owner: attempt.attemptId,
  });
  try {
    const status = await deps.git.getStatus({
      workspacePath: attempt.targetWorkspacePath,
    });
    if (status.branch !== attempt.targetBranch) {
      throw new IntegrationError({
        reason: IntegrationErrorReason.BranchMismatch,
        evidence: [status.branch, attempt.targetBranch],
      });
    }
    assertDirtyFilesAllowed(
      status.dirtyFiles,
      input.allowedPreExistingDirtyFiles ?? [],
    );
    const result = await deps.git.applyWorkerOutput({
      attempt,
      workerOutput: attempt.workerOutput,
    });
    assertFilesWithinExpected(result.changedFiles, attempt.expectedFiles);
    const now = nowIso(deps.clock);
    const updated = markWorkerOutputApplied(attempt, {
      changedFiles: result.changedFiles,
      now,
    });
    await deps.store.update(updated);
    await recordIntegrationAudit(deps, updated, {
      type: IntegrationAuditEventType.AttemptApplied,
      occurredAt: now,
      files: updated.workerOutput.changedFiles,
    });
    return updated;
  } finally {
    await deps.locks.release(lock);
  }
}

function assertDirtyFilesAllowed(
  dirtyFiles: readonly string[],
  allowedFiles: readonly string[],
): void {
  const allowed = new Set(allowedFiles.map(normalizeProjectRelativePath));
  const unexpected = dirtyFiles
    .map(normalizeProjectRelativePath)
    .filter((file) => !allowed.has(file));
  if (unexpected.length > 0) {
    throw new IntegrationError({
      reason: IntegrationErrorReason.DirtyWorkspace,
      evidence: unexpected,
    });
  }
}
