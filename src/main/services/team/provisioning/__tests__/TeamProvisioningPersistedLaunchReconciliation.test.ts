import { describe, expect, it } from 'vitest';

import { createPersistedLaunchSnapshot } from '../../TeamLaunchStateEvaluator';
import {
  decideFinalReconciledSnapshotWrite,
  decidePreferredBootstrapSnapshot,
  filterOptionalRemovedMembersFromLaunchSnapshot,
  getCommittedEvidenceOverlayWriteDecision,
  getPromotionCleanupWriteDecision,
  projectEmptyPersistedLaunchReconciliationResult,
  projectPersistedLaunchReconciliationResult,
  shouldReturnSnapshotBeforeRuntimeReconcile,
} from '../TeamProvisioningPersistedLaunchReconciliation';

import type {
  PersistedTeamLaunchMemberState,
  PersistedTeamLaunchSnapshot,
  TeamMember,
} from '@shared/types';

const at = '2026-01-01T00:00:00.000Z';

function member(
  name: string,
  overrides: Partial<PersistedTeamLaunchMemberState> = {}
): PersistedTeamLaunchMemberState {
  return {
    name,
    launchState: 'starting',
    agentToolAccepted: false,
    runtimeAlive: false,
    bootstrapConfirmed: false,
    hardFailure: false,
    lastEvaluatedAt: at,
    ...overrides,
  };
}

function snapshot(input: {
  members: Record<string, PersistedTeamLaunchMemberState>;
  expectedMembers?: readonly string[];
  launchPhase?: PersistedTeamLaunchSnapshot['launchPhase'];
}): PersistedTeamLaunchSnapshot {
  return createPersistedLaunchSnapshot({
    teamName: 'demo',
    expectedMembers: input.expectedMembers ?? Object.keys(input.members),
    launchPhase: input.launchPhase ?? 'active',
    members: input.members,
    updatedAt: at,
  });
}

function mixedSnapshot(): PersistedTeamLaunchSnapshot {
  return snapshot({
    members: {
      Builder: member('Builder', {
        providerId: 'opencode',
        laneKind: 'secondary',
        laneOwnerProviderId: 'opencode',
        laneId: 'secondary:opencode:Builder',
      }),
    },
  });
}

describe('persisted launch reconciliation helpers', () => {
  it('filters removed snapshot members before projecting reconcile statuses', () => {
    const launchSnapshot = snapshot({
      expectedMembers: ['Builder', 'Removed'],
      members: {
        Builder: member('Builder', {
          launchState: 'confirmed_alive',
          agentToolAccepted: true,
          runtimeAlive: true,
          bootstrapConfirmed: true,
        }),
        Removed: member('Removed'),
      },
    });
    const metaMembers: TeamMember[] = [
      { name: 'Builder', joinedAt: 1 },
      { name: 'Removed', joinedAt: 1, removedAt: 2 },
    ];

    const filtered = filterOptionalRemovedMembersFromLaunchSnapshot(launchSnapshot, metaMembers);
    const result = projectPersistedLaunchReconciliationResult(filtered);

    expect(filtered?.expectedMembers).toEqual(['Builder']);
    expect(Object.keys(filtered?.members ?? {})).toEqual(['Builder']);
    expect(result.statuses.Builder).toMatchObject({
      status: 'online',
      launchState: 'confirmed_alive',
      bootstrapConfirmed: true,
    });
    expect(result.statuses.Removed).toBeUndefined();
    expect(projectEmptyPersistedLaunchReconciliationResult()).toEqual({
      snapshot: null,
      statuses: {},
    });
  });

  it('reports committed evidence, bootstrap stall, promotion, and cleanup write reasons', () => {
    const previous = snapshot({
      members: {
        Builder: member('Builder', {
          launchState: 'runtime_pending_bootstrap',
          bootstrapConfirmed: false,
        }),
      },
    });
    const overlaid = snapshot({
      members: {
        Builder: member('Builder', {
          launchState: 'confirmed_alive',
          bootstrapConfirmed: true,
          diagnostics: ['opencode_bootstrap_evidence_committed'],
        }),
      },
    });
    const stalled = { ...overlaid, updatedAt: '2026-01-01T00:00:01.000Z' };

    expect(
      getCommittedEvidenceOverlayWriteDecision({
        snapshot: stalled,
        previousSnapshot: previous,
        snapshotBeforeBootstrapStallOverlay: overlaid,
      })
    ).toEqual({
      shouldWrite: true,
      reasons: ['committed_evidence_overlay', 'bootstrap_stall_overlay'],
    });

    expect(
      getPromotionCleanupWriteDecision({
        baseSnapshot: previous,
        promotedSnapshot: overlaid,
        cleanedSnapshot: stalled,
      })
    ).toEqual({
      shouldWrite: true,
      reasons: ['failure_reason_promotion', 'confirmed_bootstrap_diagnostic_cleanup'],
    });
  });

  it('keeps runtime reconcile required when bootstrap transcript inputs need reconciliation', () => {
    const launchSnapshot = mixedSnapshot();

    expect(
      shouldReturnSnapshotBeforeRuntimeReconcile({
        snapshot: launchSnapshot,
        requireMixedLaunchMetadata: true,
        needsBootstrapAcceptanceReconcile: false,
        needsConfirmedBootstrapDiagnosticReconcile: false,
        hasBootstrapTranscriptLaunchReconcileOutcome: false,
      })
    ).toBe(true);
    expect(
      shouldReturnSnapshotBeforeRuntimeReconcile({
        snapshot: launchSnapshot,
        requireMixedLaunchMetadata: true,
        hasLeadInboxLaunchReconcileHeartbeat: true,
        needsBootstrapAcceptanceReconcile: false,
        needsConfirmedBootstrapDiagnosticReconcile: false,
        hasBootstrapTranscriptLaunchReconcileOutcome: false,
      })
    ).toBe(false);
    expect(
      shouldReturnSnapshotBeforeRuntimeReconcile({
        snapshot: snapshot({ members: { Builder: member('Builder') } }),
        requireMixedLaunchMetadata: true,
        needsBootstrapAcceptanceReconcile: false,
        needsConfirmedBootstrapDiagnosticReconcile: false,
        hasBootstrapTranscriptLaunchReconcileOutcome: false,
      })
    ).toBe(false);
  });

  it('decides preferred bootstrap and final reconciled snapshot persistence actions', () => {
    const cleanBootstrap = snapshot({
      members: {
        Builder: member('Builder', {
          launchState: 'confirmed_alive',
          agentToolAccepted: true,
          runtimeAlive: true,
          bootstrapConfirmed: true,
        }),
      },
      launchPhase: 'finished',
    });
    const persisted = mixedSnapshot();
    const nonMixedPersisted = snapshot({ members: { Builder: member('Builder') } });

    expect(
      decidePreferredBootstrapSnapshot({
        preferredSnapshot: cleanBootstrap,
        bootstrapSnapshot: cleanBootstrap,
        persistedSnapshot: null,
      })
    ).toEqual({ kind: 'return_snapshot' });
    expect(
      decidePreferredBootstrapSnapshot({
        preferredSnapshot: cleanBootstrap,
        bootstrapSnapshot: cleanBootstrap,
        persistedSnapshot: nonMixedPersisted,
      })
    ).toEqual({ kind: 'clear_persisted_state' });
    expect(
      decidePreferredBootstrapSnapshot({
        preferredSnapshot: cleanBootstrap,
        bootstrapSnapshot: cleanBootstrap,
        persistedSnapshot: persisted,
      })
    ).toEqual({ kind: 'ignore' });

    expect(decideFinalReconciledSnapshotWrite(cleanBootstrap)).toEqual({
      kind: 'clear_persisted_state',
    });
    expect(decideFinalReconciledSnapshotWrite(persisted)).toEqual({ kind: 'write_snapshot' });
  });
});
