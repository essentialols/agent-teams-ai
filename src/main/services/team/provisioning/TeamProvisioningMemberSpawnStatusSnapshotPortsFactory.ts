import {
  deriveTeamLaunchAggregateState,
  snapshotFromRuntimeMemberStatuses,
  snapshotToMemberSpawnStatuses,
} from '../TeamLaunchStateEvaluator';

import {
  type MemberSpawnStatusesSnapshotPorts,
  type MemberSpawnStatusRun,
} from './TeamProvisioningMemberSpawnSnapshots';

export interface TeamProvisioningMemberSpawnStatusesSnapshotPortsFactoryDeps<
  TRun extends MemberSpawnStatusRun,
> {
  getRun: MemberSpawnStatusesSnapshotPorts<TRun>['getRun'];
  cache: Omit<MemberSpawnStatusesSnapshotPorts<TRun>['cache'], 'nowMs'> & {
    nowMs(): number;
  };
  persisted: MemberSpawnStatusesSnapshotPorts<TRun>['persisted'];
  live: Omit<
    MemberSpawnStatusesSnapshotPorts<TRun>['live'],
    | 'buildSnapshotFromRuntimeMemberStatuses'
    | 'snapshotToMemberSpawnStatuses'
    | 'deriveTeamLaunchAggregateState'
  >;
  nowIso: MemberSpawnStatusesSnapshotPorts<TRun>['nowIso'];
}

export function createTeamProvisioningMemberSpawnStatusesSnapshotPorts<
  TRun extends MemberSpawnStatusRun,
>(
  deps: TeamProvisioningMemberSpawnStatusesSnapshotPortsFactoryDeps<TRun>
): MemberSpawnStatusesSnapshotPorts<TRun> {
  return {
    getRun: (runId) => deps.getRun(runId),
    cache: {
      snapshotCache: deps.cache.snapshotCache,
      inFlightByTeam: deps.cache.inFlightByTeam,
      getCacheGeneration: (teamName) => deps.cache.getCacheGeneration(teamName),
      getTrackedRunId: (teamName) => deps.cache.getTrackedRunId(teamName),
      nowMs: () => deps.cache.nowMs(),
      liveCacheTtlMs: deps.cache.liveCacheTtlMs,
      persistedCacheTtlMs: deps.cache.persistedCacheTtlMs,
    },
    persisted: {
      readTaskActivityRepairLaunchSnapshot: (teamName) =>
        deps.persisted.readTaskActivityRepairLaunchSnapshot(teamName),
      repairStaleTaskActivityIntervalsOnce: (teamName, launchSnapshot) =>
        deps.persisted.repairStaleTaskActivityIntervalsOnce(teamName, launchSnapshot),
      reconcilePersistedLaunchState: (teamName) =>
        deps.persisted.reconcilePersistedLaunchState(teamName),
      attachLiveRuntimeMetadataToStatuses: (teamName, statuses, options) =>
        deps.persisted.attachLiveRuntimeMetadataToStatuses(teamName, statuses, options),
      getOpenCodeSecondaryBootstrapPendingMemberNames: (snapshot) =>
        deps.persisted.getOpenCodeSecondaryBootstrapPendingMemberNames(snapshot),
      resumeActiveTaskActivityForMembers: (teamName, memberNames, observedAt) =>
        deps.persisted.resumeActiveTaskActivityForMembers(teamName, memberNames, observedAt),
    },
    live: {
      refreshMemberSpawnStatusesFromLeadInbox: (run) =>
        deps.live.refreshMemberSpawnStatusesFromLeadInbox(run),
      maybeAuditMemberSpawnStatuses: (run) => deps.live.maybeAuditMemberSpawnStatuses(run),
      persistLaunchStateSnapshot: (run, phase) => deps.live.persistLaunchStateSnapshot(run, phase),
      readLaunchState: (teamName) => deps.live.readLaunchState(teamName),
      syncRunMemberSpawnStatusesFromSnapshot: (run, snapshot) =>
        deps.live.syncRunMemberSpawnStatusesFromSnapshot(run, snapshot),
      buildLiveLaunchSnapshotForRun: (run, phase) =>
        deps.live.buildLiveLaunchSnapshotForRun(run, phase),
      buildSnapshotFromRuntimeMemberStatuses: (input) => snapshotFromRuntimeMemberStatuses(input),
      buildRuntimeSpawnStatusRecord: (run) => deps.live.buildRuntimeSpawnStatusRecord(run),
      getMembersMeta: (teamName) => deps.live.getMembersMeta(teamName),
      filterRemovedMembersFromLaunchSnapshot: (snapshot, metaMembers) =>
        deps.live.filterRemovedMembersFromLaunchSnapshot(snapshot, metaMembers),
      snapshotToMemberSpawnStatuses,
      getPersistedLaunchMemberNames: (snapshot) =>
        deps.live.getPersistedLaunchMemberNames(snapshot),
      deriveTeamLaunchAggregateState,
    },
    nowIso: deps.nowIso,
  };
}
