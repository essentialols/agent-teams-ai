import { snapshotToMemberSpawnStatuses } from '../TeamLaunchStateEvaluator';

import {
  getPersistedLaunchMemberNames,
  hasMixedLaunchMetadata,
} from './TeamProvisioningLaunchStateProjection';
import { hasCommittedOpenCodeSecondaryEvidenceOverlayDelta } from './TeamProvisioningLaunchStateReconciliation';
import { filterRemovedMembersFromLaunchSnapshot } from './TeamProvisioningMemberStatusProjection';

import type {
  MemberSpawnStatusEntry,
  PersistedTeamLaunchSnapshot,
  TeamMember,
} from '@shared/types';

export interface PersistedLaunchReconciliationResult {
  snapshot: PersistedTeamLaunchSnapshot | null;
  statuses: Record<string, MemberSpawnStatusEntry>;
}

export type PersistedLaunchSnapshotWriteReason =
  | 'committed_evidence_overlay'
  | 'bootstrap_stall_overlay'
  | 'failure_reason_promotion'
  | 'confirmed_bootstrap_diagnostic_cleanup';

export interface PersistedLaunchSnapshotWriteDecision {
  shouldWrite: boolean;
  reasons: PersistedLaunchSnapshotWriteReason[];
}

export type PreferredBootstrapSnapshotDecision =
  | { kind: 'ignore' }
  | { kind: 'return_snapshot' }
  | { kind: 'clear_persisted_state' }
  | { kind: 'write_snapshot' };

export type FinalReconciledSnapshotDecision =
  | { kind: 'clear_persisted_state' }
  | { kind: 'write_snapshot' };

export function filterOptionalRemovedMembersFromLaunchSnapshot(
  snapshot: PersistedTeamLaunchSnapshot | null,
  metaMembers: readonly TeamMember[]
): PersistedTeamLaunchSnapshot | null {
  if (!snapshot) {
    return null;
  }
  return filterRemovedMembersFromLaunchSnapshot(
    snapshot,
    metaMembers,
    getPersistedLaunchMemberNames(snapshot)
  );
}

export function projectPersistedLaunchReconciliationResult(
  snapshot: PersistedTeamLaunchSnapshot | null
): PersistedLaunchReconciliationResult {
  return {
    snapshot,
    statuses: snapshotToMemberSpawnStatuses(snapshot),
  };
}

export function projectEmptyPersistedLaunchReconciliationResult(): PersistedLaunchReconciliationResult {
  return { snapshot: null, statuses: {} };
}

export function getCommittedEvidenceOverlayWriteDecision(input: {
  snapshot: PersistedTeamLaunchSnapshot | null;
  previousSnapshot: PersistedTeamLaunchSnapshot | null;
  snapshotBeforeBootstrapStallOverlay: PersistedTeamLaunchSnapshot | null;
}): PersistedLaunchSnapshotWriteDecision {
  const reasons: PersistedLaunchSnapshotWriteReason[] = [];
  if (!input.snapshot) {
    return { shouldWrite: false, reasons };
  }
  if (hasCommittedOpenCodeSecondaryEvidenceOverlayDelta(input.snapshot, input.previousSnapshot)) {
    reasons.push('committed_evidence_overlay');
  }
  if (input.snapshot !== input.snapshotBeforeBootstrapStallOverlay) {
    reasons.push('bootstrap_stall_overlay');
  }
  return { shouldWrite: reasons.length > 0, reasons };
}

export function getPromotionCleanupWriteDecision(input: {
  baseSnapshot: PersistedTeamLaunchSnapshot | null;
  promotedSnapshot: PersistedTeamLaunchSnapshot | null;
  cleanedSnapshot: PersistedTeamLaunchSnapshot | null;
}): PersistedLaunchSnapshotWriteDecision {
  const reasons: PersistedLaunchSnapshotWriteReason[] = [];
  if (!input.cleanedSnapshot) {
    return { shouldWrite: false, reasons };
  }
  if (input.promotedSnapshot !== input.baseSnapshot) {
    reasons.push('failure_reason_promotion');
  }
  if (input.cleanedSnapshot !== input.promotedSnapshot) {
    reasons.push('confirmed_bootstrap_diagnostic_cleanup');
  }
  return { shouldWrite: reasons.length > 0, reasons };
}

export function combinePersistedLaunchSnapshotWriteDecisions(
  ...decisions: readonly PersistedLaunchSnapshotWriteDecision[]
): PersistedLaunchSnapshotWriteDecision {
  const reasons = Array.from(new Set(decisions.flatMap((decision) => decision.reasons)));
  return { shouldWrite: reasons.length > 0, reasons };
}

export function shouldReturnSnapshotBeforeRuntimeReconcile(input: {
  snapshot: PersistedTeamLaunchSnapshot | null;
  requireMixedLaunchMetadata?: boolean;
  hasLeadInboxLaunchReconcileHeartbeat?: boolean;
  needsBootstrapAcceptanceReconcile: boolean;
  needsConfirmedBootstrapDiagnosticReconcile: boolean;
  hasBootstrapTranscriptLaunchReconcileOutcome: boolean;
}): boolean {
  if (!input.snapshot) {
    return false;
  }
  if (input.requireMixedLaunchMetadata === true && !hasMixedLaunchMetadata(input.snapshot)) {
    return false;
  }
  return (
    input.hasLeadInboxLaunchReconcileHeartbeat !== true &&
    !input.needsBootstrapAcceptanceReconcile &&
    !input.needsConfirmedBootstrapDiagnosticReconcile &&
    !input.hasBootstrapTranscriptLaunchReconcileOutcome
  );
}

export async function shouldReturnSnapshotBeforeRuntimeReconcileFromPorts(input: {
  snapshot: PersistedTeamLaunchSnapshot | null;
  bootstrapSnapshot: PersistedTeamLaunchSnapshot | null;
  requireMixedLaunchMetadata?: boolean;
  hasLeadInboxLaunchReconcileHeartbeat?: boolean;
  needsBootstrapAcceptanceReconcile(
    snapshot: PersistedTeamLaunchSnapshot,
    bootstrapSnapshot: PersistedTeamLaunchSnapshot | null
  ): boolean;
  needsConfirmedBootstrapDiagnosticReconcile(snapshot: PersistedTeamLaunchSnapshot): boolean;
  hasBootstrapTranscriptLaunchReconcileOutcome(
    snapshot: PersistedTeamLaunchSnapshot
  ): Promise<boolean>;
}): Promise<boolean> {
  if (!input.snapshot) {
    return false;
  }
  return shouldReturnSnapshotBeforeRuntimeReconcile({
    snapshot: input.snapshot,
    requireMixedLaunchMetadata: input.requireMixedLaunchMetadata,
    hasLeadInboxLaunchReconcileHeartbeat: input.hasLeadInboxLaunchReconcileHeartbeat,
    needsBootstrapAcceptanceReconcile: input.needsBootstrapAcceptanceReconcile(
      input.snapshot,
      input.bootstrapSnapshot
    ),
    needsConfirmedBootstrapDiagnosticReconcile: input.needsConfirmedBootstrapDiagnosticReconcile(
      input.snapshot
    ),
    hasBootstrapTranscriptLaunchReconcileOutcome:
      await input.hasBootstrapTranscriptLaunchReconcileOutcome(input.snapshot),
  });
}

export function decidePreferredBootstrapSnapshot(input: {
  preferredSnapshot: PersistedTeamLaunchSnapshot | null;
  bootstrapSnapshot: PersistedTeamLaunchSnapshot | null;
  persistedSnapshot: PersistedTeamLaunchSnapshot | null;
}): PreferredBootstrapSnapshotDecision {
  const bootstrapSelectionWouldCollapseMixedLaunch = Boolean(
    input.preferredSnapshot &&
    input.preferredSnapshot === input.bootstrapSnapshot &&
    input.preferredSnapshot.teamLaunchState === 'clean_success' &&
    !hasMixedLaunchMetadata(input.preferredSnapshot) &&
    hasMixedLaunchMetadata(input.persistedSnapshot)
  );
  if (
    !input.preferredSnapshot ||
    input.preferredSnapshot !== input.bootstrapSnapshot ||
    bootstrapSelectionWouldCollapseMixedLaunch
  ) {
    return { kind: 'ignore' };
  }
  if (!input.persistedSnapshot) {
    return { kind: 'return_snapshot' };
  }
  if (
    input.preferredSnapshot.teamLaunchState === 'clean_success' &&
    !hasMixedLaunchMetadata(input.preferredSnapshot)
  ) {
    return { kind: 'clear_persisted_state' };
  }
  return { kind: 'write_snapshot' };
}

export function decideFinalReconciledSnapshotWrite(
  snapshot: PersistedTeamLaunchSnapshot
): FinalReconciledSnapshotDecision {
  if (snapshot.teamLaunchState === 'clean_success' && !hasMixedLaunchMetadata(snapshot)) {
    return { kind: 'clear_persisted_state' };
  }
  return { kind: 'write_snapshot' };
}
