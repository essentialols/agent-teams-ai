import {
  createInitialMemberSpawnStatusEntry,
  summarizeMemberSpawnStatusRecord,
} from './TeamProvisioningMemberSpawnStatusPolicy';
import {
  buildMemberSpawnStatusTransition,
  buildMemberSpawnTranscriptConfirmationTransition,
  type PendingMemberSpawnRestart,
} from './TeamProvisioningMemberSpawnTransitions';

import type {
  MemberSpawnLivenessSource,
  MemberSpawnStatus,
  MemberSpawnStatusEntry,
  MemberSpawnStatusesSnapshot,
  PersistedTeamLaunchPhase,
  PersistedTeamLaunchSnapshot,
  TeamLaunchAggregateState,
  TeamProvisioningProgress,
} from '@shared/types';

export interface MemberSpawnStatusRun {
  runId: string;
  teamName: string;
  progress: TeamProvisioningProgress;
  onProgress(progress: TeamProvisioningProgress): void;
  expectedMembers: string[];
  detectedSessionId?: string | null;
  isLaunch: boolean;
  provisioningComplete: boolean;
  memberSpawnStatuses: Map<string, MemberSpawnStatusEntry>;
  pendingMemberRestarts?: Map<string, PendingMemberSpawnRestart>;
}

export interface MemberSpawnStatusMutationPorts<TRun extends MemberSpawnStatusRun> {
  nowIso(): string;
  syncMemberTaskActivityForRuntimeTransition(
    run: TRun,
    memberName: string,
    previous: MemberSpawnStatusEntry,
    next: MemberSpawnStatusEntry,
    observedAt: string
  ): void;
  syncMemberLaunchGraceCheck(run: TRun, memberName: string, next: MemberSpawnStatusEntry): void;
  updateLaunchDiagnostics(run: TRun): void;
  appendMemberBootstrapDiagnostic(run: TRun, memberName: string, text: string): void;
  isCurrentTrackedRun(run: TRun): boolean;
  emitMemberSpawnChange(run: TRun, memberName: string): void;
  persistLaunchStateSnapshot(run: TRun, phase: PersistedTeamLaunchPhase): Promise<unknown>;
}

export interface MemberSpawnStatusesSnapshotCacheEntry {
  expiresAtMs: number;
  generation: number;
  runId: string | null;
  snapshot: MemberSpawnStatusesSnapshot;
}

export interface MemberSpawnStatusesInFlightEntry {
  generationAtStart: number;
  runIdAtStart: string;
  promise: Promise<MemberSpawnStatusesSnapshot>;
}

export interface MemberSpawnStatusesCachePorts {
  snapshotCache: Map<string, MemberSpawnStatusesSnapshotCacheEntry>;
  inFlightByTeam: Map<string, MemberSpawnStatusesInFlightEntry>;
  getCacheGeneration(teamName: string): number;
  getTrackedRunId(teamName: string): string | null;
  nowMs(): number;
  liveCacheTtlMs: number;
  persistedCacheTtlMs: number;
}

export interface MemberSpawnStatusesPersistedPorts {
  readTaskActivityRepairLaunchSnapshot(
    teamName: string
  ): Promise<PersistedTeamLaunchSnapshot | null>;
  repairStaleTaskActivityIntervalsOnce(
    teamName: string,
    launchSnapshot: PersistedTeamLaunchSnapshot | null
  ): void;
  reconcilePersistedLaunchState(teamName: string): Promise<{
    snapshot: PersistedTeamLaunchSnapshot | null;
    statuses: Record<string, MemberSpawnStatusEntry>;
  }>;
  attachLiveRuntimeMetadataToStatuses(
    teamName: string,
    statuses: Record<string, MemberSpawnStatusEntry>,
    options?: { openCodeSecondaryBootstrapPendingMembers?: ReadonlySet<string> }
  ): Promise<Record<string, MemberSpawnStatusEntry>>;
  getOpenCodeSecondaryBootstrapPendingMemberNames(
    snapshot: PersistedTeamLaunchSnapshot | null | undefined
  ): ReadonlySet<string>;
  resumeActiveTaskActivityForMembers(
    teamName: string,
    memberNames: readonly string[],
    observedAt: string
  ): void;
}

export interface MemberSpawnStatusesLiveSnapshotPorts<TRun extends MemberSpawnStatusRun> {
  refreshMemberSpawnStatusesFromLeadInbox(run: TRun): Promise<void>;
  maybeAuditMemberSpawnStatuses(run: TRun): Promise<void>;
  persistLaunchStateSnapshot(run: TRun, phase: PersistedTeamLaunchPhase): Promise<unknown>;
  readLaunchState(teamName: string): Promise<PersistedTeamLaunchSnapshot | null>;
  syncRunMemberSpawnStatusesFromSnapshot(run: TRun, snapshot: PersistedTeamLaunchSnapshot): void;
  buildLiveLaunchSnapshotForRun(
    run: TRun,
    launchPhase: PersistedTeamLaunchPhase
  ): PersistedTeamLaunchSnapshot | null;
  buildSnapshotFromRuntimeMemberStatuses(input: {
    teamName: string;
    expectedMembers: string[];
    leadSessionId?: string;
    launchPhase: PersistedTeamLaunchPhase;
    statuses: Record<string, MemberSpawnStatusEntry>;
  }): PersistedTeamLaunchSnapshot;
  buildRuntimeSpawnStatusRecord(run: TRun): Record<string, MemberSpawnStatusEntry>;
  getMembersMeta(teamName: string): Promise<unknown[]>;
  filterRemovedMembersFromLaunchSnapshot(
    snapshot: PersistedTeamLaunchSnapshot | null,
    metaMembers: readonly unknown[]
  ): PersistedTeamLaunchSnapshot | null;
  snapshotToMemberSpawnStatuses(
    snapshot: PersistedTeamLaunchSnapshot | null
  ): Record<string, MemberSpawnStatusEntry>;
  getPersistedLaunchMemberNames(snapshot: PersistedTeamLaunchSnapshot | null): string[];
  deriveTeamLaunchAggregateState(
    summary: ReturnType<typeof summarizeMemberSpawnStatusRecord>
  ): TeamLaunchAggregateState;
}

export interface MemberSpawnStatusesSnapshotPorts<TRun extends MemberSpawnStatusRun> {
  getRun(runId: string): TRun | undefined;
  cache: MemberSpawnStatusesCachePorts;
  persisted: MemberSpawnStatusesPersistedPorts;
  live: MemberSpawnStatusesLiveSnapshotPorts<TRun>;
  nowIso(): string;
}

export function cloneMemberSpawnStatusesSnapshot(
  snapshot: MemberSpawnStatusesSnapshot
): MemberSpawnStatusesSnapshot {
  return {
    ...snapshot,
    statuses: Object.fromEntries(
      Object.entries(snapshot.statuses).map(([memberName, entry]) => [
        memberName,
        {
          ...entry,
          ...(entry.pendingPermissionRequestIds
            ? { pendingPermissionRequestIds: [...entry.pendingPermissionRequestIds] }
            : {}),
        },
      ])
    ),
    ...(snapshot.expectedMembers ? { expectedMembers: [...snapshot.expectedMembers] } : {}),
    ...(snapshot.summary ? { summary: { ...snapshot.summary } } : {}),
  };
}

export function shouldCacheMemberSpawnStatusesSnapshot(run: {
  isLaunch: boolean;
  provisioningComplete: boolean;
}): boolean {
  return run.isLaunch === true && run.provisioningComplete !== true;
}

export function setMemberSpawnStatusForRun<TRun extends MemberSpawnStatusRun>(
  params: {
    run: TRun;
    memberName: string;
    status: MemberSpawnStatus;
    error?: string;
    livenessSource?: MemberSpawnLivenessSource;
    heartbeatAt?: string;
  },
  ports: MemberSpawnStatusMutationPorts<TRun>
): void {
  const { run, memberName, status, error, livenessSource, heartbeatAt } = params;
  const prev = run.memberSpawnStatuses.get(memberName) ?? createInitialMemberSpawnStatusEntry();
  const updatedAt = ports.nowIso();
  const transition = buildMemberSpawnStatusTransition({
    previous: prev,
    requestedStatus: status,
    updatedAt,
    error,
    livenessSource,
    heartbeatAt,
    pendingRestart: run.pendingMemberRestarts?.get(memberName),
  });
  const { next } = transition;
  if (!transition.changed) {
    return;
  }

  ports.syncMemberTaskActivityForRuntimeTransition(
    run,
    memberName,
    prev,
    next,
    transition.runtimeTransitionAt
  );
  run.memberSpawnStatuses.set(memberName, next);
  if (transition.shouldClearPendingRestart) {
    run.pendingMemberRestarts?.delete(memberName);
  }
  ports.syncMemberLaunchGraceCheck(run, memberName, next);
  ports.updateLaunchDiagnostics(run);

  if (transition.diagnosticText) {
    ports.appendMemberBootstrapDiagnostic(run, memberName, transition.diagnosticText);
  }
  if (!ports.isCurrentTrackedRun(run)) return;
  ports.emitMemberSpawnChange(run, memberName);
  if (run.isLaunch) {
    void ports.persistLaunchStateSnapshot(run, run.provisioningComplete ? 'finished' : 'active');
  }
}

export function confirmMemberSpawnStatusFromTranscriptForRun<TRun extends MemberSpawnStatusRun>(
  params: {
    run: TRun;
    memberName: string;
    observedAt: string;
    source?: 'transcript' | 'runtime-proof';
  },
  ports: MemberSpawnStatusMutationPorts<TRun>
): void {
  const { run, memberName, observedAt, source = 'transcript' } = params;
  const prev = run.memberSpawnStatuses.get(memberName) ?? createInitialMemberSpawnStatusEntry();
  const updatedAt = ports.nowIso();
  const transition = buildMemberSpawnTranscriptConfirmationTransition({
    previous: prev,
    updatedAt,
    observedAt,
    source,
  });
  const { next } = transition;
  if (!transition.changed) {
    return;
  }

  ports.syncMemberTaskActivityForRuntimeTransition(
    run,
    memberName,
    prev,
    next,
    transition.runtimeTransitionAt
  );
  run.memberSpawnStatuses.set(memberName, next);
  run.pendingMemberRestarts?.delete(memberName);
  ports.syncMemberLaunchGraceCheck(run, memberName, next);
  ports.appendMemberBootstrapDiagnostic(run, memberName, transition.diagnosticText);
  if (!ports.isCurrentTrackedRun(run)) return;
  ports.emitMemberSpawnChange(run, memberName);
  if (run.isLaunch) {
    void ports.persistLaunchStateSnapshot(run, run.provisioningComplete ? 'finished' : 'active');
  }
}

async function readPersistedMemberSpawnStatusesSnapshot<TRun extends MemberSpawnStatusRun>(params: {
  teamName: string;
  resolvedRunId: string | null;
  ports: MemberSpawnStatusesSnapshotPorts<TRun>;
}): Promise<MemberSpawnStatusesSnapshot> {
  const { teamName, resolvedRunId, ports } = params;
  const generationAtStart = ports.cache.getCacheGeneration(teamName);
  const cached = ports.cache.snapshotCache.get(teamName);
  if (
    cached &&
    cached.expiresAtMs > ports.cache.nowMs() &&
    cached.runId === resolvedRunId &&
    cached.generation === generationAtStart
  ) {
    return cloneMemberSpawnStatusesSnapshot(cached.snapshot);
  }

  const repairSnapshot = await ports.persisted.readTaskActivityRepairLaunchSnapshot(teamName);
  ports.persisted.repairStaleTaskActivityIntervalsOnce(teamName, repairSnapshot);
  const { snapshot, statuses } = await ports.persisted.reconcilePersistedLaunchState(teamName);
  const nextStatuses = await ports.persisted.attachLiveRuntimeMetadataToStatuses(
    teamName,
    statuses,
    {
      openCodeSecondaryBootstrapPendingMembers:
        ports.persisted.getOpenCodeSecondaryBootstrapPendingMemberNames(snapshot),
    }
  );
  const runtimeObservedAt = ports.nowIso();
  const aliveMemberNames = Object.entries(nextStatuses)
    .filter(([, entry]) => entry.runtimeAlive === true)
    .map(([memberName]) => memberName);
  if (aliveMemberNames.length > 0) {
    ports.persisted.resumeActiveTaskActivityForMembers(
      teamName,
      aliveMemberNames,
      runtimeObservedAt
    );
  }
  const expectedMembers = snapshot ? ports.live.getPersistedLaunchMemberNames(snapshot) : undefined;
  const summary = expectedMembers
    ? summarizeMemberSpawnStatusRecord(expectedMembers, nextStatuses)
    : undefined;
  const persistedSnapshot: MemberSpawnStatusesSnapshot = {
    statuses: nextStatuses,
    runId: resolvedRunId,
    teamLaunchState: summary
      ? ports.live.deriveTeamLaunchAggregateState(summary)
      : snapshot?.teamLaunchState,
    launchPhase: snapshot?.launchPhase,
    expectedMembers,
    updatedAt: snapshot?.updatedAt,
    summary: summary ?? snapshot?.summary,
    source: 'persisted',
  };
  if (
    ports.cache.getCacheGeneration(teamName) === generationAtStart &&
    ports.cache.getTrackedRunId(teamName) === resolvedRunId
  ) {
    ports.cache.snapshotCache.set(teamName, {
      expiresAtMs: ports.cache.nowMs() + ports.cache.persistedCacheTtlMs,
      generation: generationAtStart,
      runId: resolvedRunId,
      snapshot: cloneMemberSpawnStatusesSnapshot(persistedSnapshot),
    });
  }
  return persistedSnapshot;
}

export async function buildMemberSpawnStatusesSnapshotForRun<TRun extends MemberSpawnStatusRun>(
  run: TRun,
  ports: MemberSpawnStatusesSnapshotPorts<TRun>,
  generationAtStart?: number
): Promise<MemberSpawnStatusesSnapshot> {
  const teamName = run.teamName;
  await ports.live.refreshMemberSpawnStatusesFromLeadInbox(run);
  await ports.live.maybeAuditMemberSpawnStatuses(run);
  await ports.live.persistLaunchStateSnapshot(
    run,
    run.provisioningComplete ? 'finished' : 'active'
  );

  const persisted = await ports.live.readLaunchState(teamName);
  if (persisted) {
    ports.live.syncRunMemberSpawnStatusesFromSnapshot(run, persisted);
  }
  const liveSnapshot =
    ports.live.buildLiveLaunchSnapshotForRun(
      run,
      run.provisioningComplete ? 'finished' : 'active'
    ) ??
    ports.live.buildSnapshotFromRuntimeMemberStatuses({
      teamName: run.teamName,
      expectedMembers: run.expectedMembers,
      leadSessionId: run.detectedSessionId ?? undefined,
      launchPhase: run.provisioningComplete ? 'finished' : 'active',
      statuses: ports.live.buildRuntimeSpawnStatusRecord(run),
    });
  const rawSnapshot = liveSnapshot ?? persisted;
  const metaMembers = await ports.live.getMembersMeta(teamName).catch(() => []);
  const launchSnapshot = ports.live.filterRemovedMembersFromLaunchSnapshot(
    rawSnapshot,
    metaMembers
  );
  const statuses = await ports.persisted.attachLiveRuntimeMetadataToStatuses(
    teamName,
    ports.live.snapshotToMemberSpawnStatuses(launchSnapshot),
    {
      openCodeSecondaryBootstrapPendingMembers:
        ports.persisted.getOpenCodeSecondaryBootstrapPendingMemberNames(launchSnapshot),
    }
  );
  const expectedMembers = ports.live.getPersistedLaunchMemberNames(launchSnapshot);
  const summary = summarizeMemberSpawnStatusRecord(expectedMembers, statuses);
  const spawnSnapshot: MemberSpawnStatusesSnapshot = {
    statuses,
    runId: run.runId,
    teamLaunchState: ports.live.deriveTeamLaunchAggregateState(summary),
    launchPhase: launchSnapshot?.launchPhase,
    expectedMembers,
    updatedAt: launchSnapshot?.updatedAt,
    summary,
    source: persisted ? 'merged' : 'live',
  };
  if (
    generationAtStart != null &&
    shouldCacheMemberSpawnStatusesSnapshot(run) &&
    ports.cache.getCacheGeneration(teamName) === generationAtStart &&
    ports.cache.getTrackedRunId(teamName) === run.runId
  ) {
    ports.cache.snapshotCache.set(teamName, {
      expiresAtMs: ports.cache.nowMs() + ports.cache.liveCacheTtlMs,
      generation: generationAtStart,
      runId: run.runId,
      snapshot: cloneMemberSpawnStatusesSnapshot(spawnSnapshot),
    });
  }
  return spawnSnapshot;
}

export async function getMemberSpawnStatusesSnapshot<TRun extends MemberSpawnStatusRun>(
  teamName: string,
  ports: MemberSpawnStatusesSnapshotPorts<TRun>
): Promise<MemberSpawnStatusesSnapshot> {
  const runId = ports.cache.getTrackedRunId(teamName);
  if (!runId) {
    return readPersistedMemberSpawnStatusesSnapshot({ teamName, resolvedRunId: null, ports });
  }
  const run = ports.getRun(runId);
  if (!run) {
    return readPersistedMemberSpawnStatusesSnapshot({ teamName, resolvedRunId: runId, ports });
  }

  if (!shouldCacheMemberSpawnStatusesSnapshot(run)) {
    return buildMemberSpawnStatusesSnapshotForRun(run, ports);
  }

  const generationAtStart = ports.cache.getCacheGeneration(teamName);
  const cached = ports.cache.snapshotCache.get(teamName);
  if (
    cached &&
    cached.expiresAtMs > ports.cache.nowMs() &&
    cached.runId === run.runId &&
    cached.generation === generationAtStart
  ) {
    return cloneMemberSpawnStatusesSnapshot(cached.snapshot);
  }

  const existingRequest = ports.cache.inFlightByTeam.get(teamName);
  if (
    existingRequest?.generationAtStart === generationAtStart &&
    existingRequest.runIdAtStart === run.runId
  ) {
    const snapshot = await existingRequest.promise;
    if (
      ports.cache.getCacheGeneration(teamName) === generationAtStart &&
      ports.cache.getTrackedRunId(teamName) === run.runId
    ) {
      return cloneMemberSpawnStatusesSnapshot(snapshot);
    }
    return getMemberSpawnStatusesSnapshot(teamName, ports);
  }

  const request = buildMemberSpawnStatusesSnapshotForRun(run, ports, generationAtStart).finally(
    () => {
      if (ports.cache.inFlightByTeam.get(teamName)?.promise === request) {
        ports.cache.inFlightByTeam.delete(teamName);
      }
    }
  );
  ports.cache.inFlightByTeam.set(teamName, {
    generationAtStart,
    runIdAtStart: run.runId,
    promise: request,
  });
  const snapshot = await request;
  if (
    ports.cache.getCacheGeneration(teamName) === generationAtStart &&
    ports.cache.getTrackedRunId(teamName) === run.runId
  ) {
    return cloneMemberSpawnStatusesSnapshot(snapshot);
  }
  return getMemberSpawnStatusesSnapshot(teamName, ports);
}
