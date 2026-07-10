import {
  bindTeamCrossTeamMessagingApi,
  bindTeamHttpHandlerApis,
  bindTeamIpcHandlerApis,
} from '@main/services/team/contracts/TeamProvisioningApis';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { TeamHttpHandlerApis } from '@main/services/team/contracts/TeamProvisioningApis';

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
    getRuntimeState: vi.fn(async () => ({
      teamName: 'team',
      isAlive: false,
      runId: null,
      progress: null,
    })),
    stopTeam: vi.fn(async () => undefined),
    isTeamAlive: vi.fn(() => false),
    getAliveTeams: vi.fn(() => []),
    getCurrentRunId: vi.fn(() => null),
    recordOpenCodeRuntimeBootstrapCheckin: vi.fn(),
    deliverOpenCodeRuntimeMessage: vi.fn(),
    recordOpenCodeRuntimeTaskEvent: vi.fn(),
    recordOpenCodeRuntimeHeartbeat: vi.fn(),
    answerOpenCodeRuntimePermission: vi.fn(),
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
    relayInboxFileToLiveRecipient: vi.fn(async () => ({
      kind: 'native_lead',
      relayed: 0,
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

describe('bindTeamHttpHandlerApis', () => {
  it('returns one complete aggregate with every nested HTTP facade required', () => {
    const api = bindTeamHttpHandlerApis(createSource() as never);

    expectTypeOf<TeamHttpHandlerApis>().toMatchTypeOf<Required<TeamHttpHandlerApis>>();
    expect(sortedKeys(api)).toEqual([
      'provisioningStart',
      'provisioningStatus',
      'runtime',
      'runtimeControl',
      'taskActivity',
    ]);
  });
});

describe('bindTeamIpcHandlerApis', () => {
  it('groups TeamProvisioningService behind IPC-facing facade ports only', () => {
    const api = bindTeamIpcHandlerApis(createSource() as never);

    expect(sortedKeys(api)).toEqual([
      'claudeLogs',
      'diagnostics',
      'memberLifecycle',
      'messaging',
      'preflight',
      'provisioningRun',
      'provisioningStart',
      'provisioningStatus',
      'runtime',
      'taskActivity',
      'toolApproval',
    ]);
    expect(sortedKeys(api.provisioningStart)).toEqual(['createTeam', 'launchTeam']);
    expect(sortedKeys(api.provisioningStatus)).toEqual(['getProvisioningStatus']);
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
    expect((api as unknown as Record<string, unknown>).extraServiceMethod).toBeUndefined();
  });

  it('binds facade methods to the source service instance', async () => {
    const api = bindTeamIpcHandlerApis(createSource() as never);
    const createTeam = api.provisioningStart.createTeam;
    const getProvisioningStatus = api.provisioningStatus.getProvisioningStatus;

    await expect(createTeam({} as never, () => undefined)).resolves.toEqual({
      runId: 'bound-run',
    });
    await expect(getProvisioningStatus('run-1')).resolves.toMatchObject({
      runId: 'run-1',
      state: 'spawning',
    });
  });
});

describe('bindTeamCrossTeamMessagingApi', () => {
  it('exposes only cross-team relay methods and binds them to the source service', async () => {
    const source = createSource();
    const api = bindTeamCrossTeamMessagingApi(source as never);
    const resolveCrossTeamReplyMetadata = api.resolveCrossTeamReplyMetadata;
    const relayInboxFileToLiveRecipient = api.relayInboxFileToLiveRecipient;
    const relayLeadInboxMessages = api.relayLeadInboxMessages;

    expect(sortedKeys(api)).toEqual([
      'clearPendingCrossTeamReplyExpectation',
      'isTeamAlive',
      'registerPendingCrossTeamReplyExpectation',
      'relayInboxFileToLiveRecipient',
      'relayLeadInboxMessages',
      'resolveCrossTeamReplyMetadata',
    ]);
    expect((api as unknown as Record<string, unknown>).createTeam).toBeUndefined();
    expect((api as unknown as Record<string, unknown>).sendMessageToTeam).toBeUndefined();
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
    await expect(relayInboxFileToLiveRecipient('to-team', 'team-lead')).resolves.toEqual({
      kind: 'native_lead',
      relayed: 0,
    });
    expect(source.relayInboxFileToLiveRecipient).toHaveBeenCalledWith('to-team', 'team-lead');
    await expect(relayLeadInboxMessages('to-team')).resolves.toBe(0);
  });
});
