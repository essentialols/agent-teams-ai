import {
  IntegrationAttemptStatus,
  markRejected,
  type IntegrationAttempt,
} from "../domain/integration-attempt";
import { IntegrationAuditEventType } from "../domain/integration-events";
import {
  IntegrationError,
  IntegrationErrorReason,
} from "../domain/integration-errors";
import {
  loadIntegrationAttempt,
  nowIso,
  recordIntegrationAudit,
  type IntegrationUseCaseDeps,
} from "./common";
import type {
  IntegratedOutputLedgerPort,
  RejectedOutputLedgerReceipt,
} from "../ports/integrated-output-ledger-port";
import type { GitPort } from "../ports/git-port";
import type { WorkspaceLockPort } from "../ports/workspace-lock-port";

export type RejectIntegrationAttemptInput = {
  readonly attemptId: string;
  readonly reason: string;
};

export async function rejectIntegrationAttempt(
  deps: IntegrationUseCaseDeps & {
    readonly integratedOutputLedger: IntegratedOutputLedgerPort;
    readonly git?: GitPort;
    readonly locks?: WorkspaceLockPort;
  },
  input: RejectIntegrationAttemptInput,
): Promise<IntegrationAttempt & {
  readonly consumedOutputLedger: RejectedOutputLedgerReceipt;
}> {
  const attempt = await loadIntegrationAttempt(deps.store, input.attemptId);
  const preparation = await deps.integratedOutputLedger.prepareRejection({
    attempt,
  });
  if (attempt.status === IntegrationAttemptStatus.Rejected) {
    const consumedOutputLedger = await deps.integratedOutputLedger.finalizeRejection({
      preparation,
      rejectedAt: attempt.updatedAt,
      reason: attempt.rejectReason ?? input.reason,
    });
    return { ...attempt, consumedOutputLedger };
  }
  if (attempt.merge && mergeCanStillBePending(attempt.status)) {
    await rollbackRejectedMerge(deps, attempt);
  }
  const now = nowIso(deps.clock);
  const updated = markRejected(attempt, {
    reason: input.reason,
    now,
  });
  const consumedOutputLedger = await deps.integratedOutputLedger.finalizeRejection({
    preparation,
    rejectedAt: now,
    reason: input.reason,
  });
  await deps.store.update(updated);
  await recordIntegrationAudit(deps, updated, {
    type: IntegrationAuditEventType.Rejected,
    occurredAt: now,
    safeReason: input.reason,
  });
  return { ...updated, consumedOutputLedger };
}

function mergeCanStillBePending(status: IntegrationAttemptStatus): boolean {
  return status === IntegrationAttemptStatus.Opened ||
    status === IntegrationAttemptStatus.Applied ||
    status === IntegrationAttemptStatus.ChecksRunning ||
    status === IntegrationAttemptStatus.ChecksFailed ||
    status === IntegrationAttemptStatus.ChecksPassed;
}

async function rollbackRejectedMerge(
  deps: {
    readonly git?: GitPort;
    readonly locks?: WorkspaceLockPort;
  },
  attempt: IntegrationAttempt,
): Promise<void> {
  if (!deps.git?.abortMerge || !deps.locks) {
    throw new IntegrationError({
      reason: IntegrationErrorReason.MergeRollbackFailed,
      evidence: ["git_abort_merge_unavailable"],
    });
  }
  const lock = await deps.locks.acquire({
    workspacePath: attempt.targetWorkspacePath,
    owner: attempt.attemptId,
  });
  try {
    try {
      await deps.git.abortMerge({ attempt });
    } catch (error) {
      throw new IntegrationError({
        reason: IntegrationErrorReason.MergeRollbackFailed,
        evidence: [safeErrorMessage(error)],
      });
    }
  } finally {
    await deps.locks.release(lock);
  }
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
