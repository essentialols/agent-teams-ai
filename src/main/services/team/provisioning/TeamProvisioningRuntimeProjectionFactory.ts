import {
  cloneLiveTeamAgentRuntimeMetadata,
  createTeamProvisioningLiveRuntimeMetadataPorts,
  type TeamProvisioningLiveRuntimeMetadataPorts,
} from './TeamProvisioningLiveRuntimeMetadataPortsFactory';
import {
  TeamProvisioningRuntimeSnapshotFacade,
  type TeamProvisioningRuntimeSnapshotFacadePorts,
} from './TeamProvisioningRuntimeSnapshotFacade';

import type { LiveTeamAgentRuntimeMetadata } from './TeamProvisioningRuntimeMetadataPolicy';
import type { TeamProvisioningRuntimeResourceSampling } from './TeamProvisioningRuntimeResourceSampling';
import type {
  PersistedRuntimeMemberLike,
  RuntimeAdapterRunSnapshotSource,
  TeamProvisioningRuntimeSnapshotRun,
} from './TeamProvisioningRuntimeSnapshot';
import type { TeamProvisioningAgentRuntimeSnapshotCachePort } from './TeamProvisioningRuntimeSnapshotCache';
import type {
  TeamProvisioningRuntimeStateProjectionRun,
  TeamProvisioningRuntimeStateProjectionRuntimeAdapterRun,
} from './TeamProvisioningRuntimeStateProjection';
import type {
  MemberSpawnStatusesSnapshot,
  TeamAgentRuntimeSnapshot,
  TeamProvisioningProgress,
  TeamRuntimeState,
} from '@shared/types';

export interface TeamProvisioningRuntimeProjectionRunTrackingPorts {
  getAliveRunId(teamName: string): string | null;
  getTrackedRunId(teamName: string): string | null;
  getAliveTeamNames(): string[];
  getAgentRuntimeSnapshotCacheTtlMs(teamName: string, runId: string | null): number;
}

export interface TeamProvisioningRuntimeProjectionFactoryDeps<
  TRun extends TeamProvisioningRuntimeSnapshotRun & TeamProvisioningRuntimeStateProjectionRun,
  TRuntimeAdapterRun extends RuntimeAdapterRunSnapshotSource &
    TeamProvisioningRuntimeStateProjectionRuntimeAdapterRun,
> {
  runs: ReadonlyMap<string, TRun>;
  provisioningRunByTeam: ReadonlyMap<string, string>;
  runtimeAdapterRunByTeam: ReadonlyMap<string, TRuntimeAdapterRun>;
  runtimeAdapterProgressByRunId: ReadonlyMap<string, TeamProvisioningProgress>;
  getRetainedProvisioningProgressMap(): ReadonlyMap<string, TeamProvisioningProgress>;
  runTracking: TeamProvisioningRuntimeProjectionRunTrackingPorts;
  hasSecondaryRuntimeRuns(teamName: string): boolean;
  readBootstrapRuntimeState(teamName: string): Promise<TeamRuntimeState | null>;
  teamMetaStore: TeamProvisioningRuntimeSnapshotFacadePorts['teamMetaStore'];
  membersMetaStore: TeamProvisioningRuntimeSnapshotFacadePorts['membersMetaStore'];
  launchStateStore: TeamProvisioningRuntimeSnapshotFacadePorts['launchStateStore'];
  readConfigSnapshot: TeamProvisioningRuntimeSnapshotFacadePorts['readConfigSnapshot'];
  readPersistedRuntimeMembers(teamName: string): PersistedRuntimeMemberLike[];
  getMemberSpawnStatuses(teamName: string): Promise<MemberSpawnStatusesSnapshot>;
  getLiveTeamAgentRuntimeMetadata?(
    teamName: string
  ): Promise<Map<string, LiveTeamAgentRuntimeMetadata>>;
  runtimeSnapshotCache: TeamProvisioningAgentRuntimeSnapshotCachePort<TeamAgentRuntimeSnapshot>;
  liveTeamAgentRuntimeMetadataCache: Map<
    string,
    {
      expiresAtMs: number;
      metadata: Map<string, LiveTeamAgentRuntimeMetadata>;
      runId: string | null;
    }
  >;
  runtimeResourceSampling: Pick<
    TeamProvisioningRuntimeResourceSampling,
    | 'createRuntimeSnapshotResourceSamplingPorts'
    | 'readRuntimeProcessRowsForLiveRuntimeMetadata'
    | 'readWindowsHostProcessRowsForLiveRuntimeMetadata'
  >;
  logDebug(message: string): void;
}

export interface TeamProvisioningRuntimeProjection {
  runtimeSnapshotFacade: TeamProvisioningRuntimeSnapshotFacade;
  liveRuntimeMetadataPorts: TeamProvisioningLiveRuntimeMetadataPorts;
}

export function createTeamProvisioningRuntimeProjection<
  TRun extends TeamProvisioningRuntimeSnapshotRun & TeamProvisioningRuntimeStateProjectionRun,
  TRuntimeAdapterRun extends RuntimeAdapterRunSnapshotSource &
    TeamProvisioningRuntimeStateProjectionRuntimeAdapterRun,
>(
  deps: TeamProvisioningRuntimeProjectionFactoryDeps<TRun, TRuntimeAdapterRun>
): TeamProvisioningRuntimeProjection {
  const liveRuntimeMetadataPorts = createTeamProvisioningLiveRuntimeMetadataPorts({
    runs: deps.runs,
    runtimeAdapterRunByTeam: deps.runtimeAdapterRunByTeam,
    teamMetaStore: deps.teamMetaStore,
    membersMetaStore: deps.membersMetaStore,
    launchStateStore: deps.launchStateStore,
    readConfigSnapshot: deps.readConfigSnapshot,
    readPersistedRuntimeMembers: deps.readPersistedRuntimeMembers,
    liveTeamAgentRuntimeMetadataCache: deps.liveTeamAgentRuntimeMetadataCache,
    cloneLiveTeamAgentRuntimeMetadata,
    readRuntimeProcessRowsForLiveRuntimeMetadata: (input) =>
      deps.runtimeResourceSampling.readRuntimeProcessRowsForLiveRuntimeMetadata(input),
    readWindowsHostProcessRowsForLiveRuntimeMetadata: (teamName) =>
      deps.runtimeResourceSampling.readWindowsHostProcessRowsForLiveRuntimeMetadata(teamName),
    getRuntimeSnapshotCacheGeneration: (teamName) =>
      deps.runtimeSnapshotCache.getRuntimeSnapshotCacheGeneration(teamName),
    getTrackedRunId: (teamName) => deps.runTracking.getTrackedRunId(teamName),
    getAgentRuntimeSnapshotCacheTtlMs: (teamName, runId) =>
      deps.runTracking.getAgentRuntimeSnapshotCacheTtlMs(teamName, runId),
    logDebug: deps.logDebug,
  });

  const getLiveTeamAgentRuntimeMetadata =
    deps.getLiveTeamAgentRuntimeMetadata ??
    ((teamName: string) => liveRuntimeMetadataPorts.getLiveTeamAgentRuntimeMetadata(teamName));

  const runtimeSnapshotFacade = new TeamProvisioningRuntimeSnapshotFacade({
    runs: deps.runs,
    runtimeAdapterRunByTeam: deps.runtimeAdapterRunByTeam,
    runtimeState: {
      provisioningRunByTeam: deps.provisioningRunByTeam,
      runs: deps.runs,
      runtimeAdapterRunByTeam: deps.runtimeAdapterRunByTeam,
      runtimeAdapterProgressByRunId: deps.runtimeAdapterProgressByRunId,
      getRetainedProvisioningProgressMap: deps.getRetainedProvisioningProgressMap,
    },
    runtimeStatePorts: {
      getAliveRunId: (teamName) => deps.runTracking.getAliveRunId(teamName),
      getTrackedRunId: (teamName) => deps.runTracking.getTrackedRunId(teamName),
      getAliveTeamNames: () => deps.runTracking.getAliveTeamNames(),
      hasSecondaryRuntimeRuns: deps.hasSecondaryRuntimeRuns,
      readBootstrapRuntimeState: deps.readBootstrapRuntimeState,
    },
    teamMetaStore: deps.teamMetaStore,
    membersMetaStore: deps.membersMetaStore,
    launchStateStore: deps.launchStateStore,
    readConfigSnapshot: deps.readConfigSnapshot,
    readPersistedRuntimeMembers: deps.readPersistedRuntimeMembers,
    getMemberSpawnStatuses: deps.getMemberSpawnStatuses,
    getLiveTeamAgentRuntimeMetadata,
    createRuntimeSnapshotResourceSamplingPorts: () =>
      deps.runtimeResourceSampling.createRuntimeSnapshotResourceSamplingPorts(),
    runtimeSnapshotCache: deps.runtimeSnapshotCache,
    getTrackedRunId: (teamName) => deps.runTracking.getTrackedRunId(teamName),
    getAgentRuntimeSnapshotCacheTtlMs: (teamName, runId) =>
      deps.runTracking.getAgentRuntimeSnapshotCacheTtlMs(teamName, runId),
    logDebug: deps.logDebug,
  });

  return { runtimeSnapshotFacade, liveRuntimeMetadataPorts };
}
