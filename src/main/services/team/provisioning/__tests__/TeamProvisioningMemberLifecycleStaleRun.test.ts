import { describe, expect, it } from 'vitest';

import { TeamProvisioningMemberLifecycleController } from '../TeamProvisioningMemberLifecycle';

import type { TeamProvisioningMemberLifecycleHost } from '../TeamProvisioningMemberLifecycleHostPorts';
import type { TeamProvisioningMemberLifecycleOperationUseCases } from '../TeamProvisioningMemberLifecycleOperationUseCases';
import type { ProvisioningRun } from '../TeamProvisioningMemberLifecycleTypes';
import type { TeamConfig, TeamCreateRequest } from '@shared/types';

const immediateOperationUseCases: TeamProvisioningMemberLifecycleOperationUseCases = {
  isMemberLifecycleOperationActive: () => false,
  async runMemberLifecycleOperation(_teamName, _memberName, _kind, operation) {
    return operation();
  },
};

function createRun(member: TeamCreateRequest['members'][number]): ProvisioningRun {
  return {
    runId: 'run-1',
    teamName: 'team-a',
    request: {
      teamName: 'team-a',
      cwd: '/safe-test-project',
      providerId: 'codex',
      members: [member],
    },
    detectedSessionId: null,
    memberMcpConfigPaths: [],
    memberSpawnStatuses: new Map(),
    memberSpawnToolUseIds: new Map(),
    pendingMemberRestarts: new Map(),
    mixedSecondaryLanes: [],
    processKilled: false,
    cancelRequested: false,
    isLaunch: true,
    provisioningComplete: false,
  };
}

function createConfig(member: TeamCreateRequest['members'][number]): TeamConfig {
  return {
    name: 'Team A',
    projectPath: '/safe-test-project',
    members: [member],
  } as TeamConfig;
}

function createHost(
  run: ProvisioningRun,
  overrides: Partial<TeamProvisioningMemberLifecycleHost> = {}
): TeamProvisioningMemberLifecycleHost {
  const member = run.request.members[0]!;
  const host: TeamProvisioningMemberLifecycleHost = {
    runs: new Map([[run.runId, run]]),
    runtimeAdapterRunByTeam: new Map(),
    failedOpenCodeSecondaryRetryInFlightByTeam: new Map(),
    mcpConfigBuilder: {
      async writeConfigFile() {
        return '/safe-test-project/mcp.json';
      },
    },
    membersMetaStore: {
      async getMembers() {
        return [];
      },
    },
    teamMetaStore: {
      async getMeta() {
        return null;
      },
    },
    launchStateStore: {
      async read() {
        return null;
      },
    },
    async readConfigForStrictDecision() {
      return createConfig(member);
    },
    readPersistedRuntimeMembers() {
      return [];
    },
    readPersistedTeamProjectPath() {
      return '/safe-test-project';
    },
    buildPrimaryOwnedMemberSpecForRuntime(input) {
      return input.configuredMember;
    },
    async materializeEffectiveTeamMemberSpecs(input) {
      return input.members;
    },
    resolveEffectiveConfiguredMember(configMembers, _metaMembers, memberName) {
      return (
        configMembers.find(
          (candidate) => candidate.name.trim().toLowerCase() === memberName.trim().toLowerCase()
        ) ?? null
      );
    },
    resolveLeadMemberName() {
      return 'Lead';
    },
    buildConfiguredProvisioningMember(configuredMember) {
      return configuredMember;
    },
    getAliveRunId() {
      return run.runId;
    },
    getTrackedRunId() {
      return run.runId;
    },
    getProvisioningRunId() {
      return null;
    },
    getRunTrackedCwd() {
      return run.request.cwd;
    },
    appendMemberBootstrapDiagnostic() {
      return undefined;
    },
    setMemberSpawnStatus() {
      return undefined;
    },
    upsertRunAllEffectiveMember() {
      return undefined;
    },
    removeRunAllEffectiveMember() {
      return undefined;
    },
    invalidateRuntimeSnapshotCaches() {
      return undefined;
    },
    resetRuntimeToolActivity() {
      return undefined;
    },
    clearMemberSpawnToolTracking() {
      return undefined;
    },
    isCurrentTrackedRun(candidateRun) {
      return candidateRun === run && !run.processKilled && !run.cancelRequested;
    },
    async getLiveTeamAgentRuntimeMetadata() {
      return new Map();
    },
    async persistLaunchStateSnapshot() {
      return null;
    },
    async writeLaunchStateSnapshot() {
      return null;
    },
    async buildProvisioningEnv() {
      return { env: {} };
    },
    async resolveDirectMemberLaunchIdentity() {
      return null;
    },
    async buildTeamRuntimeLaunchArgsPlan() {
      return {
        settingsArgs: [],
        fastModeArgs: [],
        runtimeTurnSettledHookArgs: [],
        providerArgs: [],
        appManagedSettingsPath: null,
      };
    },
    async buildTrackedMemberMcpLaunchConfig() {
      return null;
    },
    async removeTrackedMemberMcpLaunchConfig() {
      return undefined;
    },
    async sendMessageToRun() {
      return null;
    },
    persistInboxMessage() {
      return undefined;
    },
    persistSentMessage() {
      return undefined;
    },
    getOpenCodeRuntimeAdapter() {
      return null;
    },
    async resolveOpenCodeMemberWorkspacesForRuntime(input) {
      return input.members;
    },
    async runOpenCodeTeamRuntimeAdapterLaunch() {
      return null;
    },
    createMixedSecondaryLaneStateForMember(_targetRun, laneMember) {
      return {
        laneId: `secondary:opencode:${laneMember.name.toLowerCase()}`,
        providerId: 'opencode',
        member: laneMember,
        runId: null,
        state: 'queued',
        result: null,
        warnings: [],
        diagnostics: [],
      };
    },
    async stopSingleMixedSecondaryRuntimeLane() {
      return undefined;
    },
    getRunLeadName() {
      return 'Lead';
    },
    async launchSingleMixedSecondaryLane() {
      return undefined;
    },
    getMixedSecondaryLaunchPhase() {
      return 'active';
    },
  };

  return { ...host, ...overrides };
}

describe('TeamProvisioningMemberLifecycle stale run guards', () => {
  it('does not spawn a primary-owned attach after the active run changes during config reads', async () => {
    const member: TeamCreateRequest['members'][number] = {
      name: 'Worker',
      role: 'Developer',
      providerId: 'codex',
    };
    const run = createRun(member);
    let aliveRunId: string | null = run.runId;
    const spawnStatuses: string[] = [];
    let launched = false;
    const host = createHost(run, {
      getAliveRunId: () => aliveRunId,
      getTrackedRunId: () => aliveRunId,
      isCurrentTrackedRun: (candidateRun) => aliveRunId === candidateRun.runId,
      async readConfigForStrictDecision() {
        aliveRunId = null;
        return createConfig(member);
      },
      setMemberSpawnStatus(_targetRun, _memberName, status) {
        spawnStatuses.push(status);
      },
    });
    const controller = new TeamProvisioningMemberLifecycleController(
      host,
      immediateOperationUseCases,
      {
        restart: {
          async launchDirectProcessMemberRestart() {
            launched = true;
          },
        },
      }
    );

    await expect(controller.attachLiveRosterMember('team-a', 'Worker')).rejects.toThrow(
      'Team "team-a" is not currently running'
    );

    expect(launched).toBe(false);
    expect(spawnStatuses).toEqual([]);
  });

  it('does not enqueue an OpenCode lane reattach after workspace resolution observes a stale run', async () => {
    const member: TeamCreateRequest['members'][number] = {
      name: 'Worker',
      role: 'Developer',
      providerId: 'opencode',
    };
    const run = createRun(member);
    let aliveRunId: string | null = run.runId;
    let laneCreated = false;
    let laneLaunched = false;
    const host = createHost(run, {
      getAliveRunId: () => aliveRunId,
      getTrackedRunId: () => aliveRunId,
      isCurrentTrackedRun: (candidateRun) => aliveRunId === candidateRun.runId,
      getOpenCodeRuntimeAdapter: () => ({ providerId: 'opencode' }),
      async resolveOpenCodeMemberWorkspacesForRuntime(input) {
        aliveRunId = null;
        return input.members;
      },
      createMixedSecondaryLaneStateForMember(targetRun, laneMember) {
        laneCreated = true;
        return createHost(targetRun).createMixedSecondaryLaneStateForMember(targetRun, laneMember);
      },
      async launchSingleMixedSecondaryLane() {
        laneLaunched = true;
      },
    });
    const controller = new TeamProvisioningMemberLifecycleController(
      host,
      immediateOperationUseCases
    );

    await expect(
      controller.reattachOpenCodeOwnedMemberLane('team-a', 'Worker', {
        reason: 'manual_restart',
      })
    ).rejects.toThrow('Team "team-a" is not currently running');

    expect(laneCreated).toBe(false);
    expect(laneLaunched).toBe(false);
    expect(run.mixedSecondaryLanes).toEqual([]);
  });
});
