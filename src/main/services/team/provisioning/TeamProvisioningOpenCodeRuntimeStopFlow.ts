import { createPersistedLaunchSnapshot } from '../TeamLaunchStateEvaluator';

import type {
  TeamLaunchRuntimeAdapter,
  TeamRuntimeMemberLaunchEvidence,
  TeamRuntimeStopInput,
} from '../runtime';
import type {
  MixedSecondaryRuntimeLaneState,
  SecondaryRuntimeRunEntry,
} from './TeamProvisioningSecondaryRuntimeRuns';
import type {
  PersistedTeamLaunchSnapshot,
  TeamChangeEvent,
  TeamCreateRequest,
  TeamProviderId,
  TeamProvisioningProgress,
} from '@shared/types';

interface StopLogger {
  warn(message: string): void;
}

interface RuntimeAdapterRunEntry {
  runId: string;
  providerId: TeamProviderId;
  cwd?: string;
  members?: Record<string, TeamRuntimeMemberLaunchEvidence>;
}

export interface OpenCodeRuntimeStopFlowPorts {
  teamsBasePath: string;
  getSecondaryRuntimeRuns(teamName: string): SecondaryRuntimeRunEntry[];
  stoppingSecondaryRuntimeTeams: Set<string>;
  getOpenCodeRuntimeAdapter(): TeamLaunchRuntimeAdapter | null;
  readLaunchState(teamName: string): Promise<PersistedTeamLaunchSnapshot | null>;
  writeLaunchStateSnapshot(
    teamName: string,
    snapshot: PersistedTeamLaunchSnapshot
  ): Promise<PersistedTeamLaunchSnapshot>;
  readPersistedTeamProjectPath(teamName: string): string | null;
  clearOpenCodeRuntimeLaneStorage(input: {
    teamsBasePath: string;
    teamName: string;
    laneId: string;
    expectedRunId?: string;
  }): Promise<unknown>;
  deleteSecondaryRuntimeRun(teamName: string, laneId: string): void;
  clearSecondaryRuntimeRuns(teamName: string): void;
  runtimeAdapterRunByTeam: Map<string, RuntimeAdapterRunEntry>;
  runtimeAdapterProgressByRunId: Map<string, TeamProvisioningProgress>;
  setRuntimeAdapterProgress(progress: TeamProvisioningProgress): TeamProvisioningProgress;
  clearOpenCodeRuntimeToolApprovals(
    teamName: string,
    options: { runId?: string; laneId?: string; emitDismiss?: boolean }
  ): void;
  deleteAliveRunId(teamName: string): void;
  provisioningRunByTeam: Map<string, string>;
  invalidateRuntimeSnapshotCaches(teamName: string): void;
  emitTeamChange(event: TeamChangeEvent): void;
  logger: StopLogger;
  nowIso(): string;
}

export interface SingleMixedSecondaryRuntimeLaneStopRun {
  teamName: string;
  request: Pick<TeamCreateRequest, 'cwd'>;
}

export interface SingleMixedSecondaryRuntimeLaneStopPorts {
  teamsBasePath: string;
  getSecondaryRuntimeRuns(teamName: string): SecondaryRuntimeRunEntry[];
  getOpenCodeRuntimeAdapter(): TeamLaunchRuntimeAdapter | null;
  readLaunchState(teamName: string): Promise<PersistedTeamLaunchSnapshot | null>;
  upsertOpenCodeRuntimeLaneIndexEntry(input: {
    teamsBasePath: string;
    teamName: string;
    laneId: string;
    state: 'stopped';
    diagnostics: string[];
  }): Promise<unknown>;
  clearOpenCodeRuntimeLaneStorage(input: {
    teamsBasePath: string;
    teamName: string;
    laneId: string;
    expectedRunId?: string;
  }): Promise<unknown>;
  deleteSecondaryRuntimeRun(teamName: string, laneId: string): void;
  logger: StopLogger;
}

function isSecondaryRuntimeRunCurrent(
  teamName: string,
  expectedRun: Pick<SecondaryRuntimeRunEntry, 'laneId' | 'runId'>,
  ports: Pick<OpenCodeRuntimeStopFlowPorts, 'getSecondaryRuntimeRuns'>
): boolean {
  return ports
    .getSecondaryRuntimeRuns(teamName)
    .some((run) => run.laneId === expectedRun.laneId && run.runId === expectedRun.runId);
}

function isPrimaryRuntimeRunCurrent(
  teamName: string,
  runId: string,
  ports: Pick<OpenCodeRuntimeStopFlowPorts, 'provisioningRunByTeam' | 'runtimeAdapterRunByTeam'>
): boolean {
  const runtimeRun = ports.runtimeAdapterRunByTeam.get(teamName);
  const provisioningRunId = ports.provisioningRunByTeam.get(teamName);
  return (
    runtimeRun?.runId === runId && (provisioningRunId === undefined || provisioningRunId === runId)
  );
}

export async function stopSingleMixedSecondaryRuntimeLane(
  run: SingleMixedSecondaryRuntimeLaneStopRun,
  lane: MixedSecondaryRuntimeLaneState,
  reason: TeamRuntimeStopInput['reason'],
  ports: SingleMixedSecondaryRuntimeLaneStopPorts
): Promise<void> {
  const stoppedRunId = lane.runId;
  if (!stoppedRunId) {
    return;
  }
  const stoppedRun = { laneId: lane.laneId, runId: stoppedRunId };
  const isStoppedRunCurrent = () => isSecondaryRuntimeRunCurrent(run.teamName, stoppedRun, ports);
  const adapter = ports.getOpenCodeRuntimeAdapter();
  const previousLaunchState = await ports.readLaunchState(run.teamName);
  if (!isStoppedRunCurrent()) {
    return;
  }
  try {
    if (!adapter && stoppedRunId) {
      throw new Error('OpenCode runtime adapter is unavailable; lane stop was not confirmed');
    }
    if (adapter && stoppedRunId) {
      const result = await adapter.stop({
        runId: stoppedRunId,
        laneId: lane.laneId,
        teamName: run.teamName,
        cwd: lane.member.cwd?.trim() || run.request.cwd,
        providerId: 'opencode',
        reason,
        previousLaunchState,
        force: true,
      });
      if (!result.stopped) {
        throw new Error(
          result.diagnostics.join('\n') || `OpenCode lane ${lane.laneId} stop was not confirmed`
        );
      }
      if (!isStoppedRunCurrent()) {
        return;
      }
    }
  } catch (error) {
    ports.logger.warn(
      `[${run.teamName}] Failed to stop mixed OpenCode lane ${lane.laneId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }

  await ports
    .upsertOpenCodeRuntimeLaneIndexEntry({
      teamsBasePath: ports.teamsBasePath,
      teamName: run.teamName,
      laneId: lane.laneId,
      state: 'stopped',
      diagnostics: [`OpenCode lane stop requested: ${reason}`],
    })
    .catch(() => undefined);
  if (!isStoppedRunCurrent()) {
    return;
  }
  const clearResult = await ports.clearOpenCodeRuntimeLaneStorage({
    teamsBasePath: ports.teamsBasePath,
    teamName: run.teamName,
    laneId: lane.laneId,
    expectedRunId: stoppedRunId,
  });
  if (clearResult === 'owner_changed' || !isStoppedRunCurrent()) {
    return;
  }
  ports.deleteSecondaryRuntimeRun(run.teamName, lane.laneId);
  lane.runId = null;
  lane.state = 'finished';
  lane.result = null;
  lane.warnings = [];
  lane.diagnostics = [];
}

export async function stopMixedSecondaryRuntimeLanes(
  teamName: string,
  ports: OpenCodeRuntimeStopFlowPorts
): Promise<void> {
  const secondaryRuns = ports.getSecondaryRuntimeRuns(teamName);
  if (secondaryRuns.length === 0) {
    return;
  }
  ports.stoppingSecondaryRuntimeTeams.add(teamName);
  try {
    const adapter = ports.getOpenCodeRuntimeAdapter();
    const previousLaunchState = await ports.readLaunchState(teamName);
    if (!adapter) {
      throw new Error(
        `[${teamName}] OpenCode runtime adapter is unavailable; secondary lane stops were not confirmed`
      );
    }
    const failures: unknown[] = [];
    for (const secondaryRun of secondaryRuns) {
      try {
        const result = await adapter.stop({
          runId: secondaryRun.runId,
          laneId: secondaryRun.laneId,
          teamName,
          cwd: secondaryRun.cwd ?? ports.readPersistedTeamProjectPath(teamName) ?? undefined,
          providerId: 'opencode',
          reason: 'user_requested',
          previousLaunchState,
          force: true,
        });
        if (!result.stopped) {
          throw new Error(
            result.diagnostics.join('\n') ||
              `OpenCode secondary lane ${secondaryRun.laneId} stop was not confirmed`
          );
        }
      } catch (error) {
        ports.logger.warn(
          `[${teamName}] Failed to stop mixed OpenCode secondary lane ${secondaryRun.laneId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        failures.push(error);
        continue;
      }

      if (!isSecondaryRuntimeRunCurrent(teamName, secondaryRun, ports)) {
        continue;
      }

      try {
        const clearResult = await ports.clearOpenCodeRuntimeLaneStorage({
          teamsBasePath: ports.teamsBasePath,
          teamName,
          laneId: secondaryRun.laneId,
          expectedRunId: secondaryRun.runId,
        });
        if (clearResult === 'owner_changed') {
          continue;
        }
        if (!isSecondaryRuntimeRunCurrent(teamName, secondaryRun, ports)) {
          continue;
        }
        ports.deleteSecondaryRuntimeRun(teamName, secondaryRun.laneId);
      } catch (error) {
        ports.logger.warn(
          `[${teamName}] Failed to clean stopped OpenCode secondary lane ${secondaryRun.laneId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        failures.push(error);
      }
    }
    if (failures.length > 0) {
      throw new AggregateError(
        failures,
        `[${teamName}] Failed to stop all OpenCode secondary lanes`
      );
    }
    if (ports.getSecondaryRuntimeRuns(teamName).length === 0) {
      ports.clearSecondaryRuntimeRuns(teamName);
    }
  } finally {
    ports.stoppingSecondaryRuntimeTeams.delete(teamName);
  }
}

export async function stopOpenCodeRuntimeAdapterTeam(
  teamName: string,
  runId: string,
  ports: OpenCodeRuntimeStopFlowPorts
): Promise<void> {
  const adapter = ports.getOpenCodeRuntimeAdapter();
  const previousLaunchState = await ports.readLaunchState(teamName);
  const startedAt = ports.nowIso();
  const previousProgress = ports.runtimeAdapterProgressByRunId.get(runId);
  const runtimeRun = ports.runtimeAdapterRunByTeam.get(teamName);
  ports.setRuntimeAdapterProgress({
    runId,
    teamName,
    state: 'disconnected',
    message: 'Stopping OpenCode team through runtime adapter',
    startedAt: previousProgress?.startedAt ?? startedAt,
    updatedAt: startedAt,
  });

  const recordFailure = (error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);
    ports.setRuntimeAdapterProgress({
      runId,
      teamName,
      state: 'failed',
      message: 'OpenCode team stop failed',
      messageSeverity: 'error',
      startedAt: previousProgress?.startedAt ?? startedAt,
      updatedAt: ports.nowIso(),
      error: message,
      cliLogsTail: message,
    });
  };

  if (!adapter) {
    const error = new Error('OpenCode runtime adapter is unavailable; stop was not confirmed');
    recordFailure(error);
    throw error;
  }

  let result: Awaited<ReturnType<TeamLaunchRuntimeAdapter['stop']>>;
  try {
    result = await adapter.stop({
      runId,
      laneId: 'primary',
      teamName,
      cwd: runtimeRun?.cwd ?? ports.readPersistedTeamProjectPath(teamName) ?? undefined,
      providerId: 'opencode',
      reason: 'user_requested',
      previousLaunchState,
      force: true,
    });
    if (!result.stopped) {
      throw new Error(
        result.diagnostics.join('\n') || 'OpenCode runtime adapter stop was not confirmed'
      );
    }
    if (!isPrimaryRuntimeRunCurrent(teamName, runId, ports)) {
      return;
    }
    await ports.writeLaunchStateSnapshot(
      teamName,
      createPersistedLaunchSnapshot({
        teamName,
        expectedMembers: previousLaunchState?.expectedMembers ?? [],
        leadSessionId: previousLaunchState?.leadSessionId,
        launchPhase: 'reconciled',
        members: previousLaunchState?.members ?? {},
      })
    );
    if (!isPrimaryRuntimeRunCurrent(teamName, runId, ports)) {
      return;
    }
    const clearResult = await ports.clearOpenCodeRuntimeLaneStorage({
      teamsBasePath: ports.teamsBasePath,
      teamName,
      laneId: 'primary',
      expectedRunId: runId,
    });
    if (clearResult === 'owner_changed') {
      return;
    }
    if (!isPrimaryRuntimeRunCurrent(teamName, runId, ports)) {
      return;
    }
  } catch (error) {
    recordFailure(error);
    throw error;
  }

  ports.clearOpenCodeRuntimeToolApprovals(teamName, {
    runId,
    laneId: 'primary',
    emitDismiss: true,
  });
  ports.runtimeAdapterRunByTeam.delete(teamName);
  ports.deleteAliveRunId(teamName);
  if (ports.provisioningRunByTeam.get(teamName) === runId) {
    ports.provisioningRunByTeam.delete(teamName);
  }
  ports.invalidateRuntimeSnapshotCaches(teamName);
  ports.setRuntimeAdapterProgress({
    runId,
    teamName,
    state: 'disconnected',
    message: 'OpenCode team stopped',
    startedAt: previousProgress?.startedAt ?? startedAt,
    updatedAt: ports.nowIso(),
    cliLogsTail: result.diagnostics.join('\n') || undefined,
    warnings: result.warnings.length > 0 ? result.warnings : undefined,
  });
  ports.emitTeamChange({
    type: 'process',
    teamName,
    runId,
    detail: 'stopped',
  });
}
