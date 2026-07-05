export type WorkerBaseRevision = {
  readonly commit?: string;
};

export type TargetRevision = {
  readonly commit?: string;
};

export type BaseRevisionStatus =
  | "current"
  | "stale"
  | "needs_rebase_check"
  | "unknown";

export type BaseRevisionAssessment = {
  readonly status: BaseRevisionStatus;
  readonly workerBaseCommit?: string;
  readonly targetCommit?: string;
  readonly reasons: readonly string[];
};

export type BaseRevisionAssessmentInput = {
  readonly workerBase: WorkerBaseRevision;
  readonly target?: TargetRevision;
  readonly outputChangedFiles?: readonly string[];
  readonly outputNoDiff?: boolean;
};
