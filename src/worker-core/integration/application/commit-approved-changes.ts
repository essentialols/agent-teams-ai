import {
  IntegrationAttemptStatus,
  SecretScanStatus,
  assertFilesWithinExpected,
  assertStatus,
  markCommitCreated,
  normalizeProjectRelativePath,
  type IntegrationAttempt,
} from "../domain/integration-attempt";
import {
  IntegrationError,
  IntegrationErrorReason,
} from "../domain/integration-errors";
import { IntegrationAuditEventType } from "../domain/integration-events";
import {
  assertCommitMessageAllowed,
  assertRequiredChecksSatisfied,
  type ProjectIntegrationPolicy,
} from "../domain/integration-policy";
import {
  assertCommitIdentity,
  type CommitIdentityPort,
} from "../ports/commit-identity-port";
import {
  commitCandidateFromGitResult,
  type GitPort,
} from "../ports/git-port";
import type { SecretScannerPort } from "../ports/secret-scanner-port";
import type { WorkspaceLockPort } from "../ports/workspace-lock-port";
import {
  loadIntegrationAttempt,
  nowIso,
  recordIntegrationAudit,
  type IntegrationUseCaseDeps,
} from "./common";

export type CommitApprovedChangesDeps = IntegrationUseCaseDeps & {
  readonly git: GitPort;
  readonly commitIdentity: CommitIdentityPort;
  readonly scanner: SecretScannerPort;
  readonly locks: WorkspaceLockPort;
};

export type CommitApprovedChangesInput = {
  readonly attemptId: string;
  readonly message: string;
  readonly policy: ProjectIntegrationPolicy;
};

export async function commitApprovedChanges(
  deps: CommitApprovedChangesDeps,
  input: CommitApprovedChangesInput,
): Promise<IntegrationAttempt> {
  const attempt = await loadIntegrationAttempt(deps.store, input.attemptId);
  assertStatus(attempt, [IntegrationAttemptStatus.ChecksPassed]);
  assertRequiredChecksSatisfied(input.policy, attempt);
  assertCommitMessageAllowed(input.message);
  const lock = await deps.locks.acquire({
    workspacePath: attempt.targetWorkspacePath,
    owner: attempt.attemptId,
  });
  try {
    const diffCheck = await deps.git.diffCheck({
      workspacePath: attempt.targetWorkspacePath,
    });
    if (!diffCheck.ok) {
      throw new IntegrationError({
        reason: IntegrationErrorReason.DiffCheckFailed,
        evidence: diffCheck.safeMessage ? [diffCheck.safeMessage] : [],
      });
    }
    const status = await deps.git.getStatus({
      workspacePath: attempt.targetWorkspacePath,
    });
    const dirtyFiles = status.dirtyFiles.map(normalizeProjectRelativePath).sort();
    if (dirtyFiles.length === 0) {
      throw new IntegrationError({
        reason: IntegrationErrorReason.UnexpectedFiles,
        evidence: ["no_changed_files"],
      });
    }
    assertFilesWithinExpected(dirtyFiles, attempt.expectedFiles);
    const scan = await deps.scanner.scanFiles({
      workspacePath: attempt.targetWorkspacePath,
      files: dirtyFiles,
    });
    if (scan.status !== SecretScanStatus.Passed) {
      throw new IntegrationError({
        reason: IntegrationErrorReason.SecretScanFailed,
        evidence: scan.safeMessage ? [scan.safeMessage] : [],
      });
    }
    const committedAt = nowIso(deps.clock);
    const identity = assertCommitIdentity(await deps.commitIdentity.approvedIdentity({
      projectId: input.policy.access.scope?.projectId ?? "",
      workspacePath: attempt.targetWorkspacePath,
    }));
    const result = await deps.git.commit({
      workspacePath: attempt.targetWorkspacePath,
      message: input.message,
      files: dirtyFiles,
      identity,
    });
    const commitCandidate = commitCandidateFromGitResult({
        message: input.message,
        files: dirtyFiles,
        secretScanStatus: scan.status,
        createdAt: committedAt,
        result,
      });
    const updated = markCommitCreated(attempt, {
      commitCandidate,
      now: committedAt,
    });
    await deps.store.update(updated);
    await recordIntegrationAudit(deps, updated, {
      type: IntegrationAuditEventType.CommitCreated,
      occurredAt: committedAt,
      files: dirtyFiles,
      commitSha: commitCandidate.commitSha,
    });
    return updated;
  } finally {
    await deps.locks.release(lock);
  }
}
