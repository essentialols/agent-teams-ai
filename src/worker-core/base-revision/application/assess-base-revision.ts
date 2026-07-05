import type {
  BaseRevisionAssessment,
  BaseRevisionAssessmentInput,
} from "../domain/base-revision";

export class AssessBaseRevisionUseCase {
  assess(input: BaseRevisionAssessmentInput): BaseRevisionAssessment {
    const workerBaseCommit = normalizedCommit(input.workerBase.commit);
    const targetCommit = normalizedCommit(input.target?.commit);
    const outputChangedFiles = input.outputChangedFiles ?? [];
    const reasons: string[] = [];

    if (!workerBaseCommit) reasons.push("worker_base_commit_missing");
    if (!targetCommit) reasons.push("target_commit_missing");

    if (!workerBaseCommit || !targetCommit) {
      return {
        status: "unknown",
        ...(workerBaseCommit ? { workerBaseCommit } : {}),
        ...(targetCommit ? { targetCommit } : {}),
        reasons,
      };
    }

    if (workerBaseCommit === targetCommit) {
      return {
        status: "current",
        workerBaseCommit,
        targetCommit,
        reasons,
      };
    }

    reasons.push("target_advanced");
    if (!input.outputNoDiff && outputChangedFiles.length > 0) {
      reasons.push("output_changed_on_stale_base");
      return {
        status: "needs_rebase_check",
        workerBaseCommit,
        targetCommit,
        reasons,
      };
    }

    return {
      status: "stale",
      workerBaseCommit,
      targetCommit,
      reasons,
    };
  }
}

export function assessBaseRevision(
  input: BaseRevisionAssessmentInput,
): BaseRevisionAssessment {
  return new AssessBaseRevisionUseCase().assess(input);
}

function normalizedCommit(commit: string | undefined): string | undefined {
  const trimmed = commit?.trim();
  return trimmed ? trimmed : undefined;
}
