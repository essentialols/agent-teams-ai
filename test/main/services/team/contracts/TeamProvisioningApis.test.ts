import {
  bindTeamCrossTeamProvisioningApi,
  bindTeamHttpProvisioningApis,
  bindTeamIpcProvisioningApis,
} from '@main/services/team/contracts/TeamProvisioningApis';
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
    repairStaleTaskActivityIntervalsBeforeSnapshot: vi.fn(async () => undefined),
    getCliHelpOutput: vi.fn(async () => 'Usage'),
    prepareForProvisioning: vi.fn(async () => ({ ready: true })),
    cancelProvisioning: vi.fn(async () => undefined),
    hasProvisioningRun: vi.fn(() => false),
    getRuntimeState: vi.fn(async () => ({ teamName: 'team', alive: false, members: [] })),
    stopTeam: vi.fn(async () => undefined),
    isTeamAlive: vi.fn(() => false),
    getAliveTeams: vi.fn(() => []),
    getCurrentRunId: vi.fn(() => null),
    recordOpenCodeRuntimeBootstrapCheckin: vi.fn(async function (this: { marker: string }) {
      return { ok: true, teamName: this.marker, state: 'recorded' };
    }),
    deliverOpenCodeRuntimeMessage: vi.fn(async function (this: { marker: string }) {
      return { ok: true, teamName: this.marker, state: 'delivered' };
    }),
    recordOpenCodeRuntimeTaskEvent: vi.fn(async function (this: { marker: string }) {
      return { ok: true, teamName: this.marker, state: 'recorded' };
    }),
    recordOpenCodeRuntimeHeartbeat: vi.fn(async function (this: { marker: string }) {
      return { ok: true, teamName: this.marker, state: 'recorded' };
    }),
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
    resolveCrossTeamReplyMetadata: vi.fn(function (this: { marker: string }) {
      return {
        conversationId: `${this.marker}:conversation`,
        replyToConversationId: 'reply-conversation',
      };
    }),
    registerPendingCrossTeamReplyExpectation: vi.fn(),
    clearPendingCrossTeamReplyExpectation: vi.fn(),
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
      'taskActivity',
      'toolApproval',
    ]);
    expect(sortedKeys(api.launch)).toEqual(['createTeam', 'getProvisioningStatus', 'launchTeam']);
    expect(sortedKeys(api.preflight)).toEqual(['getCliHelpOutput', 'prepareForProvisioning']);
    expect(sortedKeys(api.provisioningRun)).toEqual(['cancelProvisioning', 'hasProvisioningRun']);
    expect(sortedKeys(api.taskActivity)).toEqual([
      'repairStaleTaskActivityIntervalsBeforeSnapshot',
    ]);
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

describe('bindTeamCrossTeamProvisioningApi', () => {
  it('exposes only cross-team relay methods and binds them to the source service', async () => {
    const source = createSource();
    const api = bindTeamCrossTeamProvisioningApi(source as never);
    const resolveCrossTeamReplyMetadata = api.resolveCrossTeamReplyMetadata;
    const relayLeadInboxMessages = api.relayLeadInboxMessages;

    expect(sortedKeys(api)).toEqual([
      'clearPendingCrossTeamReplyExpectation',
      'isTeamAlive',
      'registerPendingCrossTeamReplyExpectation',
      'relayLeadInboxMessages',
      'resolveCrossTeamReplyMetadata',
    ]);
    expect(((api as unknown) as Record<string, unknown>).createTeam).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).sendMessageToTeam).toBeUndefined();
    expect(resolveCrossTeamReplyMetadata('from-team', 'to-team')).toEqual({
      conversationId: 'bound-run:conversation',
      replyToConversationId: 'reply-conversation',
    });

    api.registerPendingCrossTeamReplyExpectation('from-team', 'to-team', 'conversation-1');
    api.clearPendingCrossTeamReplyExpectation('from-team', 'to-team', 'conversation-1');
    expect(source.registerPendingCrossTeamReplyExpectation).toHaveBeenCalledWith(
      'from-team',
      'to-team',
      'conversation-1'
    );
    expect(source.clearPendingCrossTeamReplyExpectation).toHaveBeenCalledWith(
      'from-team',
      'to-team',
      'conversation-1'
    );
    await expect(relayLeadInboxMessages('to-team')).resolves.toBe(0);
  });
});

describe('bindTeamHttpProvisioningApis', () => {
  it('groups TeamProvisioningService behind HTTP-facing facade ports only', async () => {
    const source = createSource();
    const api = bindTeamHttpProvisioningApis(source as never);
    const launchApi = api.launch as NonNullable<typeof api.launch>;
    const runtimeApi = api.runtime as NonNullable<typeof api.runtime>;
    const runtimeControlApi = api.runtimeControl as NonNullable<typeof api.runtimeControl>;
    const taskActivityApi = api.taskActivity as NonNullable<typeof api.taskActivity>;
    const statusApi = api.status as NonNullable<typeof api.status>;

    expect(sortedKeys(api)).toEqual([
      'launch',
      'runtime',
      'runtimeControl',
      'status',
      'taskActivity',
    ]);
    expect(sortedKeys(launchApi)).toEqual(['createTeam', 'launchTeam']);
    expect(sortedKeys(statusApi)).toEqual(['getProvisioningStatus']);
    expect(sortedKeys(taskActivityApi)).toEqual([
      'repairStaleTaskActivityIntervalsBeforeSnapshot',
    ]);
    expect(sortedKeys(runtimeApi)).toEqual([
      'getAliveTeams',
      'getRuntimeState',
      'stopTeam',
    ]);
    expect(sortedKeys(runtimeControlApi)).toEqual([
      'deliverOpenCodeRuntimeMessage',
      'recordOpenCodeRuntimeBootstrapCheckin',
      'recordOpenCodeRuntimeHeartbeat',
      'recordOpenCodeRuntimeTaskEvent',
    ]);
    expect(((api as unknown) as Record<string, unknown>).preflight).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).provisioningRun).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).memberLifecycle).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).diagnostics).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).claudeLogs).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).messaging).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).toolApproval).toBeUndefined();
    expect(((api as unknown) as Record<string, unknown>).extraServiceMethod).toBeUndefined();

    await expect(runtimeControlApi.deliverOpenCodeRuntimeMessage({})).resolves.toMatchObject({
      teamName: 'bound-run',
      state: 'delivered',
    });
    await expect(
      taskActivityApi.repairStaleTaskActivityIntervalsBeforeSnapshot('team-bound')
    ).resolves.toBeUndefined();
    expect(source.repairStaleTaskActivityIntervalsBeforeSnapshot).toHaveBeenCalledWith(
      'team-bound'
    );
  });
});
