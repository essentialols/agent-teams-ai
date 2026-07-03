import { describe, expect, it, vi } from 'vitest';

import { createTeamProvisioningMemberSpawnStatusesSnapshotPorts } from '../TeamProvisioningMemberSpawnStatusSnapshotPortsFactory';

import type { MemberSpawnStatusRun } from '../TeamProvisioningMemberSpawnSnapshots';
import type {
  MemberSpawnStatusEntry,
  PersistedTeamLaunchSnapshot,
  TeamProvisioningProgress,
} from '@shared/types';

const NOW = '2026-07-03T00:00:00.000Z';

function status(overrides: Partial<MemberSpawnStatusEntry> = {}): MemberSpawnStatusEntry {
  return {
    status: 'online',
    launchState: 'confirmed_alive',
    updatedAt: NOW,
    runtimeAlive: true,
    bootstrapConfirmed: true,
    livenessSource: 'heartbeat',
    ...overrides,
  };
}

function run(overrides: Partial<MemberSpawnStatusRun> = {}): MemberSpawnStatusRun {
  return {
    runId: 'run-1',
    teamName: 'team-a',
    progress: {
      state: 'running',
      message: 'running',
      startedAt: NOW,
      updatedAt: NOW,
    } as TeamProvisioningProgress,
    onProgress: vi.fn(),
    expectedMembers: ['Builder'],
    detectedSessionId: 'session-1',
    isLaunch: true,
    provisioningComplete: false,
    memberSpawnStatuses: new Map([['Builder', status()]]),
    ...overrides,
  };
}

describe('TeamProvisioningMemberSpawnStatusSnapshotPortsFactory', () => {
  it('wires member spawn status snapshot ports through provisioning dependencies', async () => {
    const targetRun = run();
    const launchSnapshot = createTeamProvisioningMemberSpawnStatusesSnapshotPorts({
      getRun: () => targetRun,
      cache: {
        snapshotCache: new Map(),
        inFlightByTeam: new Map(),
        getCacheGeneration: () => 0,
        getTrackedRunId: () => null,
        nowMs: () => 1,
        liveCacheTtlMs: 500,
        persistedCacheTtlMs: 5_000,
      },
      persisted: {
        readTaskActivityRepairLaunchSnapshot: vi.fn(),
        repairStaleTaskActivityIntervalsOnce: vi.fn(),
        reconcilePersistedLaunchState: vi.fn(),
        attachLiveRuntimeMetadataToStatuses: vi.fn(),
        getOpenCodeSecondaryBootstrapPendingMemberNames: vi.fn(),
        resumeActiveTaskActivityForMembers: vi.fn(),
      },
      live: {
        refreshMemberSpawnStatusesFromLeadInbox: vi.fn(),
        maybeAuditMemberSpawnStatuses: vi.fn(),
        persistLaunchStateSnapshot: vi.fn(),
        readLaunchState: vi.fn(),
        syncRunMemberSpawnStatusesFromSnapshot: vi.fn(),
        buildLiveLaunchSnapshotForRun: vi.fn(),
        buildRuntimeSpawnStatusRecord: vi.fn(),
        getMembersMeta: vi.fn(),
        filterRemovedMembersFromLaunchSnapshot: vi.fn(),
        getPersistedLaunchMemberNames: vi.fn(),
      },
      nowIso: () => NOW,
    }).live.buildSnapshotFromRuntimeMemberStatuses({
      teamName: 'team-a',
      expectedMembers: ['Builder'],
      leadSessionId: 'session-1',
      launchPhase: 'active',
      statuses: { Builder: status() },
    });
    const snapshotCache = new Map();
    const inFlightByTeam = new Map();
    const pendingMembers = new Set(['Builder']);
    const getRun = vi.fn(() => targetRun);
    const getCacheGeneration = vi.fn(() => 7);
    const getTrackedRunId = vi.fn(() => 'run-1');
    const nowMs = vi.fn(() => 123);
    const readTaskActivityRepairLaunchSnapshot = vi.fn(async () => launchSnapshot);
    const repairStaleTaskActivityIntervalsOnce = vi.fn();
    const reconcilePersistedLaunchState = vi.fn(async () => ({
      snapshot: launchSnapshot,
      statuses: { Builder: status() },
    }));
    const attachLiveRuntimeMetadataToStatuses = vi.fn(async (_teamName, statuses) => statuses);
    const getOpenCodeSecondaryBootstrapPendingMemberNames = vi.fn(() => pendingMembers);
    const resumeActiveTaskActivityForMembers = vi.fn();
    const refreshMemberSpawnStatusesFromLeadInbox = vi.fn(async () => undefined);
    const maybeAuditMemberSpawnStatuses = vi.fn(async () => undefined);
    const persistLaunchStateSnapshot = vi.fn(async () => undefined);
    const readLaunchState = vi.fn(async () => launchSnapshot);
    const syncRunMemberSpawnStatusesFromSnapshot = vi.fn();
    const buildLiveLaunchSnapshotForRun = vi.fn(() => launchSnapshot);
    const buildRuntimeSpawnStatusRecord = vi.fn(() => ({ Builder: status() }));
    const getMembersMeta = vi.fn(async () => [{ name: 'Builder' }]);
    const filterRemovedMembersFromLaunchSnapshot = vi.fn(
      (snapshot: PersistedTeamLaunchSnapshot | null) => snapshot
    );
    const getPersistedLaunchMemberNames = vi.fn(() => ['Builder']);
    const nowIso = vi.fn(() => NOW);

    const ports = createTeamProvisioningMemberSpawnStatusesSnapshotPorts({
      getRun,
      cache: {
        snapshotCache,
        inFlightByTeam,
        getCacheGeneration,
        getTrackedRunId,
        nowMs,
        liveCacheTtlMs: 500,
        persistedCacheTtlMs: 5_000,
      },
      persisted: {
        readTaskActivityRepairLaunchSnapshot,
        repairStaleTaskActivityIntervalsOnce,
        reconcilePersistedLaunchState,
        attachLiveRuntimeMetadataToStatuses,
        getOpenCodeSecondaryBootstrapPendingMemberNames,
        resumeActiveTaskActivityForMembers,
      },
      live: {
        refreshMemberSpawnStatusesFromLeadInbox,
        maybeAuditMemberSpawnStatuses,
        persistLaunchStateSnapshot,
        readLaunchState,
        syncRunMemberSpawnStatusesFromSnapshot,
        buildLiveLaunchSnapshotForRun,
        buildRuntimeSpawnStatusRecord,
        getMembersMeta,
        filterRemovedMembersFromLaunchSnapshot,
        getPersistedLaunchMemberNames,
      },
      nowIso,
    });

    expect(ports.getRun('run-1')).toBe(targetRun);
    expect(ports.cache.snapshotCache).toBe(snapshotCache);
    expect(ports.cache.inFlightByTeam).toBe(inFlightByTeam);
    expect(ports.cache.getCacheGeneration('team-a')).toBe(7);
    expect(ports.cache.getTrackedRunId('team-a')).toBe('run-1');
    expect(ports.cache.nowMs()).toBe(123);
    expect(ports.cache.liveCacheTtlMs).toBe(500);
    expect(ports.cache.persistedCacheTtlMs).toBe(5_000);
    await expect(ports.persisted.readTaskActivityRepairLaunchSnapshot('team-a')).resolves.toBe(
      launchSnapshot
    );
    ports.persisted.repairStaleTaskActivityIntervalsOnce('team-a', launchSnapshot);
    await expect(ports.persisted.reconcilePersistedLaunchState('team-a')).resolves.toEqual({
      snapshot: launchSnapshot,
      statuses: { Builder: status() },
    });
    await expect(
      ports.persisted.attachLiveRuntimeMetadataToStatuses('team-a', { Builder: status() })
    ).resolves.toEqual({ Builder: status() });
    expect(ports.persisted.getOpenCodeSecondaryBootstrapPendingMemberNames(launchSnapshot)).toBe(
      pendingMembers
    );
    ports.persisted.resumeActiveTaskActivityForMembers('team-a', ['Builder'], NOW);
    await ports.live.refreshMemberSpawnStatusesFromLeadInbox(targetRun);
    await ports.live.maybeAuditMemberSpawnStatuses(targetRun);
    await ports.live.persistLaunchStateSnapshot(targetRun, 'active');
    await expect(ports.live.readLaunchState('team-a')).resolves.toBe(launchSnapshot);
    ports.live.syncRunMemberSpawnStatusesFromSnapshot(targetRun, launchSnapshot);
    expect(ports.live.buildLiveLaunchSnapshotForRun(targetRun, 'active')).toBe(launchSnapshot);
    expect(
      ports.live.buildSnapshotFromRuntimeMemberStatuses({
        teamName: 'team-a',
        expectedMembers: ['Builder'],
        leadSessionId: 'session-1',
        launchPhase: 'active',
        statuses: { Builder: status() },
      }).expectedMembers
    ).toEqual(['Builder']);
    expect(ports.live.buildRuntimeSpawnStatusRecord(targetRun)).toEqual({ Builder: status() });
    await expect(ports.live.getMembersMeta('team-a')).resolves.toEqual([{ name: 'Builder' }]);
    expect(ports.live.filterRemovedMembersFromLaunchSnapshot(launchSnapshot, [])).toBe(
      launchSnapshot
    );
    expect(ports.live.snapshotToMemberSpawnStatuses(launchSnapshot).Builder.status).toBe('online');
    expect(ports.live.getPersistedLaunchMemberNames(launchSnapshot)).toEqual(['Builder']);
    expect(
      ports.live.deriveTeamLaunchAggregateState({
        confirmedCount: 1,
        pendingCount: 0,
        failedCount: 0,
        runtimeAlivePendingCount: 0,
      })
    ).toBe('clean_success');
    expect(ports.nowIso()).toBe(NOW);

    expect(getRun).toHaveBeenCalledWith('run-1');
    expect(getCacheGeneration).toHaveBeenCalledWith('team-a');
    expect(getTrackedRunId).toHaveBeenCalledWith('team-a');
    expect(nowMs).toHaveBeenCalledTimes(1);
    expect(repairStaleTaskActivityIntervalsOnce).toHaveBeenCalledWith('team-a', launchSnapshot);
    expect(resumeActiveTaskActivityForMembers).toHaveBeenCalledWith('team-a', ['Builder'], NOW);
    expect(syncRunMemberSpawnStatusesFromSnapshot).toHaveBeenCalledWith(targetRun, launchSnapshot);
    expect(filterRemovedMembersFromLaunchSnapshot).toHaveBeenCalledWith(launchSnapshot, []);
    expect(nowIso).toHaveBeenCalledTimes(1);
  });
});
