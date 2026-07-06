import { bindTeamIpcProvisioningApis } from '@main/services/team/contracts/TeamProvisioningApis';
import { describe, expect, it, vi } from 'vitest';

function sortedKeys(value: object): string[] {
  return Object.keys(value).sort();
}

function createSource() {
  return {
    marker: 'bound-run',
    extraServiceMethod: vi.fn(),
    createTeam: vi.fn(async function (this: { marker: string }) {
      return { runId: this.marker };
    }),
    launchTeam: vi.fn(async () => ({ runId: 'launch-run' })),
    getProvisioningStatus: vi.fn(async () => ({ runId: 'run-1', state: 'spawning' })),
    getCliHelpOutput: vi.fn(async () => 'Usage'),
    prepareForProvisioning: vi.fn(async () => ({ ready: true })),
    cancelProvisioning: vi.fn(async () => undefined),
    hasProvisioningRun: vi.fn(() => false),
    getRuntimeState: vi.fn(async () => ({ teamName: 'team', alive: false, members: [] })),
    stopTeam: vi.fn(async () => undefined),
    isTeamAlive: vi.fn(() => false),
    getAliveTeams: vi.fn(() => []),
    getCurrentRunId: vi.fn(() => null),
    getMemberSpawnStatuses: vi.fn(async () => ({ statuses: {} })),
    attachLiveRosterMember: vi.fn(async () => undefined),
    detachLiveRosterMember: vi.fn(async () => undefined),
    restartMember: vi.fn(async () => undefined),
    retryFailedOpenCodeSecondaryLanes: vi.fn(async () => ({
      attempted: [],
      confirmed: [],
      pending: [],
      failed: [],
      skipped: [],
    })),
    skipMemberForLaunch: vi.fn(async () => undefined),
    getLeadActivityState: vi.fn(() => ({ state: 'idle' })),
    getLeadContextUsage: vi.fn(() => ({ usage: null })),
    getTeamAgentRuntimeSnapshot: vi.fn(async () => ({ teamName: 'team', members: {} })),
    getClaudeLogs: vi.fn(async () => ({ lines: [], total: 0, hasMore: false })),
    sendMessageToTeam: vi.fn(async () => undefined),
    relayOpenCodeMemberInboxMessages: vi.fn(async () => ({
      relayed: 0,
      attempted: 0,
      delivered: 0,
      failed: 0,
    })),
    relayLeadInboxMessages: vi.fn(async () => 0),
    getOpenCodeRuntimeDeliveryStatus: vi.fn(async () => null),
    resolveRuntimeRecipientProviderId: vi.fn(async () => undefined),
    getLiveLeadProcessMessages: vi.fn(() => []),
    getCurrentLeadSessionId: vi.fn(() => null),
    pushLiveLeadProcessMessage: vi.fn(),
    respondToToolApproval: vi.fn(async () => undefined),
    updateToolApprovalSettings: vi.fn(),
  };
}

describe('bindTeamIpcProvisioningApis', () => {
  it('groups TeamProvisioningService behind IPC-facing facade ports only', () => {
    const api = bindTeamIpcProvisioningApis(createSource() as never);

    expect(sortedKeys(api)).toEqual([
      'claudeLogs',
      'diagnostics',
      'launch',
      'memberLifecycle',
      'messaging',
      'preflight',
      'provisioningRun',
      'runtime',
      'toolApproval',
    ]);
    expect(sortedKeys(api.launch)).toEqual(['createTeam', 'getProvisioningStatus', 'launchTeam']);
    expect(sortedKeys(api.preflight)).toEqual(['getCliHelpOutput', 'prepareForProvisioning']);
    expect(sortedKeys(api.provisioningRun)).toEqual(['cancelProvisioning', 'hasProvisioningRun']);
    expect(sortedKeys(api.runtime)).toEqual([
      'getAliveTeams',
      'getCurrentRunId',
      'getRuntimeState',
      'isTeamAlive',
      'stopTeam',
    ]);
    expect(sortedKeys(api.memberLifecycle)).toEqual([
      'attachLiveRosterMember',
      'detachLiveRosterMember',
      'getMemberSpawnStatuses',
      'restartMember',
      'retryFailedOpenCodeSecondaryLanes',
      'skipMemberForLaunch',
    ]);
    expect(sortedKeys(api.diagnostics)).toEqual([
      'getLeadActivityState',
      'getLeadContextUsage',
      'getTeamAgentRuntimeSnapshot',
    ]);
    expect(sortedKeys(api.claudeLogs)).toEqual(['getClaudeLogs']);
    expect(sortedKeys(api.messaging)).toEqual([
      'getCurrentLeadSessionId',
      'getLiveLeadProcessMessages',
      'getOpenCodeRuntimeDeliveryStatus',
      'pushLiveLeadProcessMessage',
      'relayLeadInboxMessages',
      'relayOpenCodeMemberInboxMessages',
      'resolveRuntimeRecipientProviderId',
      'sendMessageToTeam',
    ]);
    expect(sortedKeys(api.toolApproval)).toEqual([
      'respondToToolApproval',
      'updateToolApprovalSettings',
    ]);
    expect(((api as unknown) as Record<string, unknown>).extraServiceMethod).toBeUndefined();
  });

  it('binds facade methods to the source service instance', async () => {
    const api = bindTeamIpcProvisioningApis(createSource() as never);
    const createTeam = api.launch.createTeam;

    await expect(createTeam({} as never, () => undefined)).resolves.toEqual({
      runId: 'bound-run',
    });
  });
});
