export type CodexGoalProjectStopPolicyInput = {
  readonly workerAlive: boolean;
  readonly silentStale: boolean;
  readonly heartbeatOnlyNoOutput: boolean;
  readonly freshProgressAlive: boolean;
  readonly progressCpuActive: boolean | undefined;
  readonly appServerProcessAlive: boolean | undefined;
  readonly recommendedAction: string | undefined;
};

export type CodexGoalProjectStopPolicyDecision =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: "project_control_fresh_worker_stop_denied";
      readonly requiredState: "silent_stale_or_heartbeat_only_no_output";
      readonly safeMessage: string;
    };

/**
 * Project controllers may retire stale or no-output workers, but they must not
 * turn a fresh healthy attempt into failed_no_output. Emergency cancellation of
 * a healthy attempt belongs to the operator/runtime boundary, not orchestration.
 */
export function decideCodexGoalProjectStop(
  input: CodexGoalProjectStopPolicyInput,
): CodexGoalProjectStopPolicyDecision {
  if (!input.workerAlive || input.silentStale || input.heartbeatOnlyNoOutput) {
    return { allowed: true };
  }

  const hasPositiveHealthEvidence =
    input.freshProgressAlive ||
    input.progressCpuActive === true ||
    input.appServerProcessAlive === true ||
    input.recommendedAction === "wait_for_worker";

  return {
    allowed: false,
    reason: "project_control_fresh_worker_stop_denied",
    requiredState: "silent_stale_or_heartbeat_only_no_output",
    safeMessage: hasPositiveHealthEvidence
      ? "ProjectScopedControl cannot stop a worker with fresh positive health evidence. Keep monitoring or use an operator-owned emergency path."
      : "ProjectScopedControl cannot stop an alive worker until stale or heartbeat-only no-output state is proven. A model-supplied force flag grants no kill authority.",
  };
}
