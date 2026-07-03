import { describe, expect, it, vi } from 'vitest';

import {
  createOpenCodeRuntimeDeliveryPorts,
  createTeamProvisioningOpenCodeRuntimeDeliveryBoundary,
  getOpenCodeRuntimeRecoveryLaneIds,
  type TeamProvisioningOpenCodeRuntimeDeliveryBoundaryPorts,
} from '../TeamProvisioningOpenCodeRuntimeDelivery';

import type { OpenCodeRuntimeCheckinRun } from '../TeamProvisioningOpenCodeRuntimeCheckin';
import type { PersistedTeamLaunchSnapshot } from '@shared/types';

describe('TeamProvisioningOpenCodeRuntimeDelivery', () => {
  describe('createOpenCodeRuntimeDeliveryPorts', () => {
    it('creates the runtime destination ports used by OpenCode delivery', () => {
      const ports = createOpenCodeRuntimeDeliveryPorts({
        sentMessagesStore: {
          appendMessage: vi.fn(),
          readMessages: vi.fn(),
        },
        inboxReader: {
          getMessagesFor: vi.fn(),
        },
        inboxWriter: {
          sendMessage: vi.fn(),
        },
        getCrossTeamSender: () => vi.fn(),
      });

      expect(ports.map((port) => port.kind)).toEqual([
        'user_sent_messages',
        'member_inbox',
        'cross_team_outbox',
      ]);
    });
  });

  describe('createTeamProvisioningOpenCodeRuntimeDeliveryBoundary', () => {
    it('normalizes member inbox delivery wake scheduling', () => {
      const scheduleOpenCodePromptDeliveryWatchdog = vi.fn();
      const boundary = createBoundary({
        scheduleOpenCodePromptDeliveryWatchdog,
      });

      boundary.scheduleOpenCodeMemberInboxDeliveryWake({
        teamName: ' Team ',
        memberName: ' Builder ',
        messageId: ' message-1 ',
        delayMs: -25,
      });
      boundary.scheduleOpenCodeMemberInboxDeliveryWake({
        teamName: 'Team',
        memberName: 'Builder',
        messageId: 'message-2',
      });

      expect(scheduleOpenCodePromptDeliveryWatchdog).toHaveBeenNthCalledWith(1, {
        teamName: 'Team',
        memberName: 'Builder',
        messageId: 'message-1',
        delayMs: 0,
      });
      expect(scheduleOpenCodePromptDeliveryWatchdog).toHaveBeenNthCalledWith(2, {
        teamName: 'Team',
        memberName: 'Builder',
        messageId: 'message-2',
        delayMs: 500,
      });
    });

    it('does not schedule member inbox delivery wake when disabled or identifiers are blank', () => {
      const scheduleOpenCodePromptDeliveryWatchdog = vi.fn();
      const boundary = createBoundary({
        isOpenCodePromptDeliveryWatchdogEnabled: () => false,
        scheduleOpenCodePromptDeliveryWatchdog,
      });

      boundary.scheduleOpenCodeMemberInboxDeliveryWake({
        teamName: 'Team',
        memberName: 'Builder',
        messageId: 'message-1',
      });
      createBoundary({
        scheduleOpenCodePromptDeliveryWatchdog,
      }).scheduleOpenCodeMemberInboxDeliveryWake({
        teamName: 'Team',
        memberName: ' ',
        messageId: 'message-2',
      });

      expect(scheduleOpenCodePromptDeliveryWatchdog).not.toHaveBeenCalled();
    });
  });

  describe('getOpenCodeRuntimeRecoveryLaneIds', () => {
    it('prefers lane index keys when the runtime lane index has entries', () => {
      expect(
        getOpenCodeRuntimeRecoveryLaneIds({
          laneIndexEntries: {
            primary: { laneId: 'primary' },
            'lane-builder': { laneId: 'secondary-builder' },
          },
          launchSnapshot: snapshotWithMembers({
            builder: {
              laneId: 'snapshot-builder',
              laneOwnerProviderId: 'opencode',
            },
          }),
        })
      ).toEqual(['primary', 'lane-builder']);
    });

    it('falls back to unique OpenCode lane ids from the launch snapshot', () => {
      expect(
        getOpenCodeRuntimeRecoveryLaneIds({
          laneIndexEntries: {},
          launchSnapshot: snapshotWithMembers({
            builder: {
              laneId: ' secondary-builder ',
              laneOwnerProviderId: 'opencode',
            },
            reviewer: {
              laneId: 'secondary-builder',
              laneOwnerProviderId: 'opencode',
            },
            designer: {
              laneId: 'secondary-designer',
              laneOwnerProviderId: 'opencode',
            },
            nativeMember: {
              laneId: 'native-lane',
              laneOwnerProviderId: 'anthropic',
            },
          }),
        })
      ).toEqual(['secondary-builder', 'secondary-designer']);
    });

    it('defaults to the primary lane when no lane evidence exists', () => {
      expect(
        getOpenCodeRuntimeRecoveryLaneIds({
          laneIndexEntries: {},
          launchSnapshot: snapshotWithMembers({}),
        })
      ).toEqual(['primary']);
    });
  });
});

function createBoundary(
  overrides: Partial<
    TeamProvisioningOpenCodeRuntimeDeliveryBoundaryPorts<OpenCodeRuntimeCheckinRun>
  > = {}
) {
  const ports: TeamProvisioningOpenCodeRuntimeDeliveryBoundaryPorts<OpenCodeRuntimeCheckinRun> = {
    getTeamsBasePath: () => '/tmp/teams',
    resolveOpenCodeRuntimeLaneId: async () => 'primary',
    resolveCurrentOpenCodeRuntimeRunId: async () => 'run-1',
    readLaunchState: async () => null,
    writeLaunchState: async () => {},
    readConfigForStrictDecision: async () => null,
    readMetaMembers: async () => [],
    readPersistedRuntimeMembers: () => [],
    getTrackedRun: () => null,
    persistTrackedRunLaunchState: async () => {},
    invalidateRuntimeSnapshotCaches: () => {},
    emitMemberSpawnChange: () => {},
    emitTeamChange: () => {},
    createOpenCodeRuntimeBootstrapEvidencePorts: () => {
      throw new Error('unused');
    },
    upsertOpenCodeTaskRecord: async () => {
      throw new Error('unused');
    },
    syncMemberTaskActivityForRuntimeTransition: () => {},
    syncMemberLaunchGraceCheck: () => {},
    sentMessagesStore: {
      appendMessage: vi.fn(),
      readMessages: vi.fn(),
    },
    inboxReader: {
      getMessagesFor: vi.fn(),
    },
    inboxWriter: {
      sendMessage: vi.fn(),
    },
    getCrossTeamSender: () => null,
    logger: {
      warn: vi.fn(),
    },
    isOpenCodeRuntimeRecipient: async () => true,
    getOpenCodeAgendaSyncRecoveryBypassMessageIds: async () => new Set(),
    resolveOpenCodeMemberDeliveryIdentity: async () => ({
      ok: true,
      canonicalMemberName: 'Builder',
      laneId: 'primary',
    }),
    tryRecoverOpenCodeRuntimeLaneForConfiguredMemberAndVerifyActive: async () => true,
    decideOpenCodeRuntimeDeliveryUserFacingAdvisory: async (record) => ({
      record,
      decision: { action: 'defer' },
    }),
    isOpenCodePromptDeliveryWatchdogEnabled: () => true,
    scheduleOpenCodePromptDeliveryWatchdog: vi.fn(),
    readLaunchStateForDeliveryRecovery: async () => null,
    nowIso: () => '2026-01-01T00:00:00.000Z',
    ...overrides,
  };

  return createTeamProvisioningOpenCodeRuntimeDeliveryBoundary(ports);
}

function snapshotWithMembers(
  members: Record<string, Partial<Pick<PersistedTeamLaunchSnapshot, 'members'>['members'][string]>>
): Pick<PersistedTeamLaunchSnapshot, 'members'> {
  return {
    members: members as Pick<PersistedTeamLaunchSnapshot, 'members'>['members'],
  };
}
