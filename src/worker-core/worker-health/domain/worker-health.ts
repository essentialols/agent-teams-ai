export type WorkerHealthStatus =
  | "running"
  | "stopped"
  | "completed"
  | "blocked"
  | "failed"
  | "unknown";

export type WorkerLiveness =
  | "alive"
  | "dead"
  | "stale"
  | "unknown";

export type ProgressFreshness =
  | "fresh"
  | "stale"
  | "silent_stale"
  | "heartbeat_only_no_output"
  | "unknown";

export type ActiveWriterRiskKind =
  | "none"
  | "active_worker"
  | "stale_live_worker"
  | "dirty_workspace_without_worker"
  | "state_mismatch"
  | "unknown";

export type ActiveWriterRisk = {
  readonly kind: ActiveWriterRiskKind;
  readonly risky: boolean;
  readonly reasons: readonly string[];
};

export type WorkerSafetyState = {
  readonly safeToContinue: boolean;
  readonly blocked: boolean;
  readonly reasons: readonly string[];
};

export type WorkerHealthObservation = {
  readonly status: WorkerHealthStatus;
  readonly processAlive?: boolean;
  readonly liveness?: WorkerLiveness;
  readonly progressStatus?: string;
  readonly progressHeartbeatAgeMs?: number;
  readonly staleAfterMs?: number;
  readonly progressStale?: boolean;
  readonly silentStale?: boolean;
  readonly heartbeatOnlyNoOutput?: boolean;
  readonly resultExists?: boolean;
  readonly resultStatus?: string;
  readonly workspaceDirty?: boolean;
  readonly changedFilesCount?: number;
  readonly controlInboxSafeToContinue?: boolean;
  readonly controlInboxPendingCount?: number;
};

export type WorkerHealthSnapshot = {
  readonly alive: boolean;
  readonly freshProgressAlive: boolean;
  readonly stale: boolean;
  readonly silentStale: boolean;
  readonly heartbeatOnlyNoOutput: boolean;
  readonly blocked: boolean;
  readonly safeToContinue: boolean;
  readonly liveness: WorkerLiveness;
  readonly progressFreshness: ProgressFreshness;
  readonly activeWriterRisk: ActiveWriterRisk;
  readonly reasons: readonly string[];
  readonly evidence: readonly string[];
};
