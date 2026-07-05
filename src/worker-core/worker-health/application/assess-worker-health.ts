import type {
  ActiveWriterRisk,
  ProgressFreshness,
  WorkerHealthObservation,
  WorkerHealthSnapshot,
  WorkerLiveness,
  WorkerSafetyState,
} from "../domain/worker-health";

export class AssessWorkerHealthUseCase {
  assess(observation: WorkerHealthObservation): WorkerHealthSnapshot {
    const liveness = resolveLiveness(observation);
    const alive = liveness === "alive" || liveness === "stale";
    const progressFreshness = resolveProgressFreshness(observation);
    const stale = progressFreshness === "stale" ||
      progressFreshness === "silent_stale" ||
      liveness === "stale";
    const silentStale = Boolean(
      observation.silentStale || progressFreshness === "silent_stale",
    );
    const heartbeatOnlyNoOutput = Boolean(
      observation.heartbeatOnlyNoOutput ||
        progressFreshness === "heartbeat_only_no_output",
    );
    const freshProgressAlive = Boolean(
      alive &&
        observation.progressStatus === "running" &&
        progressFreshness === "fresh",
    );
    const activeWriterRisk = assessActiveWriterRisk({
      observation,
      alive,
      stale,
      silentStale,
      heartbeatOnlyNoOutput,
    });
    const safety = assessSafety({
      observation,
      activeWriterRisk,
      alive,
      stale,
      silentStale,
      heartbeatOnlyNoOutput,
    });
    const reasons = [
      ...activeWriterRisk.reasons,
      ...safety.reasons,
    ];

    return {
      alive,
      freshProgressAlive,
      stale,
      silentStale,
      heartbeatOnlyNoOutput,
      blocked: safety.blocked,
      safeToContinue: safety.safeToContinue,
      liveness,
      progressFreshness,
      activeWriterRisk,
      reasons,
      evidence: evidenceFor(observation),
    };
  }
}

export function assessWorkerHealth(
  observation: WorkerHealthObservation,
): WorkerHealthSnapshot {
  return new AssessWorkerHealthUseCase().assess(observation);
}

function resolveLiveness(observation: WorkerHealthObservation): WorkerLiveness {
  if (
    observation.status === "completed" ||
    observation.resultStatus === "completed" ||
    observation.resultStatus === "done"
  ) {
    return observation.processAlive ? "alive" : "dead";
  }
  if (observation.liveness === "stale" || observation.silentStale) {
    return "stale";
  }
  if (observation.processAlive === true) return "alive";
  if (observation.processAlive === false) return "dead";
  if (observation.liveness) return observation.liveness;
  if (observation.status === "running" && observation.progressStatus === "running") {
    return "unknown";
  }
  return "unknown";
}

function resolveProgressFreshness(
  observation: WorkerHealthObservation,
): ProgressFreshness {
  if (observation.heartbeatOnlyNoOutput) return "heartbeat_only_no_output";
  if (observation.silentStale) return "silent_stale";
  if (observation.progressStale) return "stale";
  if (
    observation.progressHeartbeatAgeMs !== undefined &&
    observation.staleAfterMs !== undefined
  ) {
    return observation.progressHeartbeatAgeMs > observation.staleAfterMs
      ? "stale"
      : "fresh";
  }
  return "unknown";
}

function assessActiveWriterRisk(input: {
  readonly observation: WorkerHealthObservation;
  readonly alive: boolean;
  readonly stale: boolean;
  readonly silentStale: boolean;
  readonly heartbeatOnlyNoOutput: boolean;
}): ActiveWriterRisk {
  const reasons: string[] = [];
  if (
    input.observation.status === "completed" &&
    input.alive &&
    input.observation.resultExists !== false
  ) {
    reasons.push("completed_result_with_live_worker");
    return risk("state_mismatch", reasons);
  }
  if (input.alive && (input.stale || input.silentStale || input.heartbeatOnlyNoOutput)) {
    reasons.push(
      input.heartbeatOnlyNoOutput
        ? "heartbeat_only_no_output"
        : "stale_live_worker",
    );
    return risk("stale_live_worker", reasons);
  }
  if (input.alive) {
    reasons.push("worker_alive");
    return risk("active_worker", reasons);
  }
  if (
    input.observation.workspaceDirty &&
    input.observation.status !== "completed"
  ) {
    reasons.push("dirty_workspace_without_worker");
    return risk("dirty_workspace_without_worker", reasons);
  }
  return risk("none", reasons);
}

function assessSafety(input: {
  readonly observation: WorkerHealthObservation;
  readonly activeWriterRisk: ActiveWriterRisk;
  readonly alive: boolean;
  readonly stale: boolean;
  readonly silentStale: boolean;
  readonly heartbeatOnlyNoOutput: boolean;
}): WorkerSafetyState {
  const reasons: string[] = [];
  if (input.observation.controlInboxSafeToContinue === false) {
    reasons.push("control_inbox_blocks_continuation");
  }
  if (input.activeWriterRisk.risky) {
    reasons.push(...input.activeWriterRisk.reasons);
  }
  const blocked = reasons.length > 0;
  return {
    blocked,
    safeToContinue: !blocked,
    reasons,
  };
}

function risk(
  kind: ActiveWriterRisk["kind"],
  reasons: readonly string[],
): ActiveWriterRisk {
  return {
    kind,
    risky: kind !== "none",
    reasons,
  };
}

function evidenceFor(observation: WorkerHealthObservation): readonly string[] {
  return [
    `status:${observation.status}`,
    `processAlive:${String(observation.processAlive)}`,
    `progressStatus:${String(observation.progressStatus)}`,
    `progressHeartbeatAgeMs:${String(observation.progressHeartbeatAgeMs)}`,
    `staleAfterMs:${String(observation.staleAfterMs)}`,
    `workspaceDirty:${String(observation.workspaceDirty)}`,
    `changedFilesCount:${String(observation.changedFilesCount)}`,
    `controlInboxSafeToContinue:${String(observation.controlInboxSafeToContinue)}`,
  ];
}
