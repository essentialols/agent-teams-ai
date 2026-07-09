import type {
  RunCapacityHint,
  RunObservationSnapshot,
} from "./run-observability";
import { runEventProviderKindFromString } from "./run-provider-kind";
import {
  RunAccountCapacityStatus,
  RunControlInboxStatus,
  RunLivenessStatus,
  RunOutcomeStatus,
  RunRuntimeIssueKind,
  RunSafetyConfidence,
  RunSafetyStatus,
  RunWorkspaceStatus,
  type RunAccountCapacityReadModel,
  type RunControlInboxReadModel,
  type RunEventReadModels,
  type RunLivenessReadModel,
  type RunOutcomeReadModel,
  type RunSafetyReadModel,
  type RunWorkspaceReadModel,
} from "./run-event-types";
import {
  isString,
  maskAccountIdentity,
  uniqueStrings,
} from "./run-event-payload";

export function runEventReadModelsFromSnapshot(
  snapshot: RunObservationSnapshot,
): RunEventReadModels {
  const issueKind = runtimeIssueKindFromDecisionReason(
    snapshot.readOnlyDecision.reason,
  );
  return {
    schemaVersion: 1,
    runId: snapshot.runId,
    providerKind: runEventProviderKindFromString(snapshot.providerKind),
    observedAt: snapshot.observedAt,
    safety: safetyReadModelFromSnapshot(snapshot, issueKind),
    liveness: livenessReadModelFromSnapshot(snapshot),
    workspace: workspaceReadModelFromSnapshot(snapshot),
    accountCapacity: accountCapacityReadModelFromSnapshot(snapshot),
    outcome: outcomeReadModelFromSnapshot(snapshot),
    controlInbox: controlInboxReadModelFromSnapshot(snapshot),
  };
}

function safetyReadModelFromSnapshot(
  snapshot: RunObservationSnapshot,
  issueKind: RunRuntimeIssueKind,
): RunSafetyReadModel {
  const decision = snapshot.readOnlyDecision;
  const evidence = decision.evidence ?? [];
  switch (decision.kind) {
    case "review_completed":
      return {
        status: RunSafetyStatus.ReviewRequired,
        safeToContinue: false,
        reviewOnly: true,
        issueKind,
        reason: decision.reason,
        confidence: RunSafetyConfidence.High,
        evidence,
      };
    case "keep_watching":
      return {
        status: RunSafetyStatus.Watch,
        safeToContinue: true,
        reviewOnly: false,
        issueKind,
        reason: decision.reason,
        confidence: RunSafetyConfidence.High,
        evidence,
      };
    case "capacity_blocked":
      return {
        status: RunSafetyStatus.Blocked,
        safeToContinue: false,
        reviewOnly: true,
        issueKind,
        reason: decision.reason,
        confidence: RunSafetyConfidence.High,
        evidence,
      };
    case "stale_needs_inspection":
    case "manual_review_required":
      return {
        status: RunSafetyStatus.ReviewRequired,
        safeToContinue: false,
        reviewOnly: true,
        issueKind,
        reason: decision.reason,
        confidence: RunSafetyConfidence.High,
        evidence,
      };
    case "unsafe_state_mismatch":
      return {
        status: RunSafetyStatus.Unsafe,
        safeToContinue: false,
        reviewOnly: true,
        issueKind,
        reason: decision.reason,
        confidence: RunSafetyConfidence.High,
        evidence,
      };
  }
}

function livenessReadModelFromSnapshot(
  snapshot: RunObservationSnapshot,
): RunLivenessReadModel {
  const status = (() => {
    if (snapshot.status === "completed" && snapshot.liveness === "alive") {
      return RunLivenessStatus.CompletedLive;
    }
    if (snapshot.progress?.heartbeatOnlyNoOutput) return RunLivenessStatus.Quiet;
    if (snapshot.liveness === "alive") return RunLivenessStatus.Alive;
    if (snapshot.liveness === "dead") return RunLivenessStatus.Dead;
    if (snapshot.liveness === "stale" || snapshot.progress?.stale) {
      return RunLivenessStatus.Stale;
    }
    return RunLivenessStatus.Unknown;
  })();
  return {
    status,
    ...(snapshot.process?.alive === undefined ? {} : { processAlive: snapshot.process.alive }),
    ...(snapshot.process?.aliveReason === undefined
      ? {}
      : { aliveReason: snapshot.process.aliveReason }),
    ...(snapshot.process?.supervisor === undefined
      ? {}
      : { supervisor: snapshot.process.supervisor }),
    ...(snapshot.process?.pid === undefined ? {} : { processPid: snapshot.process.pid }),
    ...(snapshot.progress?.heartbeatAgeMs === undefined
      ? {}
      : { heartbeatAgeMs: snapshot.progress.heartbeatAgeMs }),
    ...(snapshot.progress?.staleAfterMs === undefined
      ? {}
      : { staleAfterMs: snapshot.progress.staleAfterMs }),
    ...(snapshot.logs?.byteLength === undefined ? {} : { logByteLength: snapshot.logs.byteLength }),
    ...(snapshot.progress?.updatedAt === undefined
      ? {}
      : { lastProgressAt: snapshot.progress.updatedAt }),
    ...(snapshot.logs?.updatedAt === undefined ? {} : { lastLogAt: snapshot.logs.updatedAt }),
  };
}

function workspaceReadModelFromSnapshot(
  snapshot: RunObservationSnapshot,
): RunWorkspaceReadModel {
  const workspace = snapshot.workspace;
  const status = (() => {
    if (!workspace) return RunWorkspaceStatus.Unknown;
    if (workspace.warning) return RunWorkspaceStatus.Warning;
    if (workspace.exists === false) return RunWorkspaceStatus.Missing;
    if (workspace.dirty) return RunWorkspaceStatus.Dirty;
    if (workspace.dirty === false) return RunWorkspaceStatus.Clean;
    return RunWorkspaceStatus.Unknown;
  })();
  const reviewOnly = status === RunWorkspaceStatus.Dirty &&
    snapshot.status !== "running";
  return {
    status,
    reviewOnly,
    ...(workspace?.exists === undefined ? {} : { exists: workspace.exists }),
    ...(workspace?.dirty === undefined ? {} : { dirty: workspace.dirty }),
    ...(workspace?.changedFilesCount === undefined
      ? {}
      : { changedFilesCount: workspace.changedFilesCount }),
    changedFilesSample: [...(workspace?.changedFiles ?? [])].slice(0, 50),
    ...(workspace?.warning === undefined ? {} : { warning: workspace.warning }),
  };
}

function accountCapacityReadModelFromSnapshot(
  snapshot: RunObservationSnapshot,
): RunAccountCapacityReadModel {
  const hints = snapshot.capacity ?? [];
  const blocked = hints.filter(isBlockedCapacityHint);
  const cooldown = hints.filter((hint) => hint.availability === "cooldown");
  const status = (() => {
    if (hints.length === 0) return RunAccountCapacityStatus.Unknown;
    if (blocked.length > 0) return RunAccountCapacityStatus.Blocked;
    if (cooldown.length > 0) return RunAccountCapacityStatus.Cooldown;
    return RunAccountCapacityStatus.Available;
  })();
  return {
    status,
    totalHints: hints.length,
    blockedCount: blocked.length,
    cooldownCount: cooldown.length,
    maskedAccounts: uniqueStrings(
      hints.map((hint) => maskAccountIdentity(hint.account)).filter(isString),
    ),
    reasons: uniqueStrings(hints.map((hint) => hint.reason).filter(isString)),
  };
}

function outcomeReadModelFromSnapshot(
  snapshot: RunObservationSnapshot,
): RunOutcomeReadModel {
  const status = (() => {
    if (snapshot.status === "running") return RunOutcomeStatus.Running;
    if (snapshot.status === "completed") return RunOutcomeStatus.Completed;
    if (snapshot.status === "failed") return RunOutcomeStatus.Failed;
    if (snapshot.readOnlyDecision.kind === "capacity_blocked") {
      return RunOutcomeStatus.Blocked;
    }
    if (snapshot.readOnlyDecision.kind === "manual_review_required" ||
        snapshot.readOnlyDecision.kind === "stale_needs_inspection" ||
        snapshot.readOnlyDecision.kind === "unsafe_state_mismatch") {
      return RunOutcomeStatus.NeedsAttention;
    }
    if (
      snapshot.workspace?.dirty ||
      (snapshot.workspace?.changedFilesCount ?? 0) > 0
    ) {
      return RunOutcomeStatus.Partial;
    }
    return RunOutcomeStatus.Unknown;
  })();
  return {
    status,
    ...(snapshot.result?.status === undefined ? {} : { resultStatus: snapshot.result.status }),
    ...(snapshot.result?.reason === undefined ? {} : { reason: snapshot.result.reason }),
    ...(snapshot.result?.updatedAt === undefined ? {} : { updatedAt: snapshot.result.updatedAt }),
  };
}

function controlInboxReadModelFromSnapshot(
  snapshot: RunObservationSnapshot,
): RunControlInboxReadModel {
  const controlInbox = snapshot.controlInbox;
  const pendingCount = controlInbox?.pendingCount ?? 0;
  const deliveredCount = controlInbox?.deliveredCount ?? 0;
  const blockedDeliveryCount = controlInbox?.blockedDeliveryCount ?? 0;
  const status = (() => {
    if (!controlInbox) return RunControlInboxStatus.Unknown;
    if (controlInbox.safeToContinue === false) return RunControlInboxStatus.Unsafe;
    if (blockedDeliveryCount > 0) return RunControlInboxStatus.Blocked;
    if (pendingCount > 0) return RunControlInboxStatus.Pending;
    if (deliveredCount > 0) return RunControlInboxStatus.Delivered;
    return RunControlInboxStatus.Clear;
  })();
  return {
    status,
    pendingCount,
    deliveredCount,
    blockedDeliveryCount,
    ...(controlInbox?.safeToContinue === undefined
      ? {}
      : { safeToContinue: controlInbox.safeToContinue }),
    ...(controlInbox?.latestSignalAt === undefined
      ? {}
      : { latestSignalAt: controlInbox.latestSignalAt }),
    ...(controlInbox?.latestDeliveredAt === undefined
      ? {}
      : { latestDeliveredAt: controlInbox.latestDeliveredAt }),
  };
}

function runtimeIssueKindFromDecisionReason(reason: string): RunRuntimeIssueKind {
  switch (reason) {
    case RunRuntimeIssueKind.WorkerObservable:
      return RunRuntimeIssueKind.WorkerObservable;
    case RunRuntimeIssueKind.TerminalResultCompleted:
      return RunRuntimeIssueKind.TerminalResultCompleted;
    case RunRuntimeIssueKind.CompletedResultWithLiveProcess:
      return RunRuntimeIssueKind.CompletedResultWithLiveProcess;
    case RunRuntimeIssueKind.StoppedRunWithRunningProgress:
      return RunRuntimeIssueKind.StoppedRunWithRunningProgress;
    case RunRuntimeIssueKind.ObservableProgressStale:
      return RunRuntimeIssueKind.ObservableProgressStale;
    case RunRuntimeIssueKind.HeartbeatOnlyNoOutput:
      return RunRuntimeIssueKind.HeartbeatOnlyNoOutput;
    case RunRuntimeIssueKind.AccountOrCapacityUnavailable:
      return RunRuntimeIssueKind.AccountOrCapacityUnavailable;
    case RunRuntimeIssueKind.DirtyWorkspaceWithoutRunningWorker:
      return RunRuntimeIssueKind.DirtyWorkspaceWithoutRunningWorker;
    case RunRuntimeIssueKind.StoppedWithoutTerminalResult:
      return RunRuntimeIssueKind.StoppedWithoutTerminalResult;
    case RunRuntimeIssueKind.NonRunningOrUnknownFailure:
      return RunRuntimeIssueKind.NonRunningOrUnknownFailure;
    case RunRuntimeIssueKind.GuidancePending:
      return RunRuntimeIssueKind.GuidancePending;
    case RunRuntimeIssueKind.GuidanceDelivered:
      return RunRuntimeIssueKind.GuidanceDelivered;
    case RunRuntimeIssueKind.ManualReviewRequired:
      return RunRuntimeIssueKind.ManualReviewRequired;
    case RunRuntimeIssueKind.ControlInboxBlocked:
      return RunRuntimeIssueKind.ControlInboxBlocked;
    default:
      return RunRuntimeIssueKind.Unknown;
  }
}

function isBlockedCapacityHint(hint: RunCapacityHint): boolean {
  return hint.status === "auth_missing" ||
    hint.status === "auth_invalid" ||
    hint.status === "blocked" ||
    hint.status === "invalid" ||
    hint.availability === "cooldown" ||
    hint.availability === "quota_exhausted" ||
    hint.availability === "disabled";
}
