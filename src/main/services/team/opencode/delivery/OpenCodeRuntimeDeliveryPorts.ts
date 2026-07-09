import type { TeamInboxReader } from '../../TeamInboxReader';
import type { TeamInboxWriter } from '../../TeamInboxWriter';
import type { TeamSentMessagesStore } from '../../TeamSentMessagesStore';
import type { RuntimeDeliveryLocation } from './RuntimeDeliveryJournal';
import type { RuntimeDeliveryDestinationPort } from './RuntimeDeliveryService';
import type { CrossTeamSendResult, InboxMessage, TaskRef } from '@shared/types/team';

export type OpenCodeRuntimeDeliveryCrossTeamSender = (request: {
  fromTeam: string;
  fromMember: string;
  toTeam: string;
  toMember?: string;
  text: string;
  summary?: string;
  taskRefs?: TaskRef[];
  messageId?: string;
  timestamp?: string;
  conversationId?: string;
}) => Promise<unknown>;

export interface OpenCodeRuntimeDeliveryPortsDependencies {
  sentMessagesStore: Pick<TeamSentMessagesStore, 'appendMessage' | 'readMessages'>;
  inboxReader: Pick<TeamInboxReader, 'getMessagesFor'>;
  inboxWriter: Pick<TeamInboxWriter, 'sendMessage'>;
  getCrossTeamSender: () => OpenCodeRuntimeDeliveryCrossTeamSender | null;
}

function runtimeTaskRefs(
  value: readonly TaskRef[] | undefined
): InboxMessage['taskRefs'] | undefined {
  return value?.length
    ? value.map((taskRef) => ({
        taskId: taskRef.taskId,
        displayId: taskRef.displayId,
        teamName: taskRef.teamName,
      }))
    : undefined;
}

function isCrossTeamSendResult(value: unknown): value is CrossTeamSendResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const messageId = (value as { messageId?: unknown }).messageId;
  return typeof messageId === 'string' && messageId.trim().length > 0;
}

function parseCrossTeamRecipient(
  value: string | undefined,
  fallbackTeamName: string,
  fallbackMemberName: string | undefined
): { teamName: string; memberName: string } {
  const separator = typeof value === 'string' ? value.indexOf('.') : -1;
  if (separator > 0 && separator < String(value).length - 1) {
    return {
      teamName: String(value).slice(0, separator),
      memberName: String(value).slice(separator + 1),
    };
  }
  return { teamName: fallbackTeamName, memberName: fallbackMemberName?.trim() || 'team-lead' };
}

function isCrossTeamLocation(
  location: RuntimeDeliveryLocation | undefined
): location is Extract<RuntimeDeliveryLocation, { kind: 'cross_team_outbox' }> {
  return location?.kind === 'cross_team_outbox';
}

export function createOpenCodeRuntimeDeliveryPorts(
  deps: OpenCodeRuntimeDeliveryPortsDependencies
): RuntimeDeliveryDestinationPort[] {
  const userMessagesPort: RuntimeDeliveryDestinationPort = {
    kind: 'user_sent_messages',
    write: async ({ envelope, destinationMessageId }) => {
      await deps.sentMessagesStore.appendMessage(envelope.teamName, {
        from: envelope.fromMemberName,
        to: 'user',
        text: envelope.text,
        timestamp: envelope.createdAt,
        read: true,
        summary: envelope.summary ?? undefined,
        messageId: destinationMessageId,
        source: 'lead_process',
        leadSessionId: envelope.runtimeSessionId,
        taskRefs: runtimeTaskRefs(envelope.taskRefs),
      });
      return {
        kind: 'user_sent_messages',
        teamName: envelope.teamName,
        messageId: destinationMessageId,
      };
    },
    verify: async ({ destination, destinationMessageId }) => {
      if (destination.kind !== 'user_sent_messages') {
        return { found: false, location: null, diagnostics: ['destination kind mismatch'] };
      }
      const messages = await deps.sentMessagesStore.readMessages(destination.teamName);
      const found = messages.some((message) => message.messageId === destinationMessageId);
      return {
        found,
        location: found
          ? {
              kind: 'user_sent_messages',
              teamName: destination.teamName,
              messageId: destinationMessageId,
            }
          : null,
        diagnostics: [],
      };
    },
    buildChangeEvent: ({ teamName }) => ({
      type: 'lead-message',
      teamName,
      data: { detail: 'opencode-runtime-delivery' },
    }),
  };

  const memberInboxPort: RuntimeDeliveryDestinationPort = {
    kind: 'member_inbox',
    write: async ({ envelope, destinationMessageId }) => {
      if (typeof envelope.to !== 'object' || !('memberName' in envelope.to)) {
        throw new Error('Runtime delivery member destination missing memberName');
      }
      const memberName = envelope.to.memberName;
      await deps.inboxWriter.sendMessage(envelope.teamName, {
        member: memberName,
        from: envelope.fromMemberName,
        to: memberName,
        text: envelope.text,
        timestamp: envelope.createdAt,
        messageId: destinationMessageId,
        summary: envelope.summary ?? undefined,
        source: 'inbox',
        leadSessionId: envelope.runtimeSessionId,
        taskRefs: runtimeTaskRefs(envelope.taskRefs),
      });
      return {
        kind: 'member_inbox',
        teamName: envelope.teamName,
        memberName,
        messageId: destinationMessageId,
      };
    },
    verify: async ({ destination, destinationMessageId }) => {
      if (destination.kind !== 'member_inbox') {
        return { found: false, location: null, diagnostics: ['destination kind mismatch'] };
      }
      const messages = await deps.inboxReader.getMessagesFor(
        destination.teamName,
        destination.memberName
      );
      const found = messages.some((message) => message.messageId === destinationMessageId);
      return {
        found,
        location: found
          ? {
              kind: 'member_inbox',
              teamName: destination.teamName,
              memberName: destination.memberName,
              messageId: destinationMessageId,
            }
          : null,
        diagnostics: [],
      };
    },
    buildChangeEvent: ({ teamName, location }) => ({
      type: 'inbox',
      teamName,
      data: {
        detail:
          location.kind === 'member_inbox' ? `inboxes/${location.memberName}.json` : 'inboxes',
      },
    }),
  };

  const crossTeamPort: RuntimeDeliveryDestinationPort = {
    kind: 'cross_team_outbox',
    write: async ({ envelope, destinationMessageId }) => {
      if (typeof envelope.to !== 'object' || !('teamName' in envelope.to)) {
        throw new Error('Runtime delivery cross-team destination missing teamName');
      }
      const crossTeamSender = deps.getCrossTeamSender();
      if (!crossTeamSender) {
        throw new Error('Cross-team sender is not configured');
      }
      const taskRefs = runtimeTaskRefs(envelope.taskRefs);
      const result = await crossTeamSender({
        fromTeam: envelope.teamName,
        fromMember: envelope.fromMemberName,
        toTeam: envelope.to.teamName,
        toMember: envelope.to.memberName,
        text: envelope.text,
        summary: envelope.summary ?? undefined,
        ...(taskRefs ? { taskRefs } : {}),
        messageId: destinationMessageId,
        timestamp: envelope.createdAt,
        conversationId: envelope.idempotencyKey,
      });
      const deliveredMessageId = isCrossTeamSendResult(result)
        ? result.messageId.trim()
        : destinationMessageId;
      const senderMessages = await deps.sentMessagesStore.readMessages(envelope.teamName);
      const senderCopy =
        senderMessages.find((message) => message.messageId === deliveredMessageId) ??
        senderMessages.find((message) => message.messageId === destinationMessageId);
      const recipient = parseCrossTeamRecipient(
        senderCopy?.to,
        envelope.to.teamName,
        envelope.to.memberName
      );
      return {
        kind: 'cross_team_outbox',
        fromTeamName: envelope.teamName,
        toTeamName: recipient.teamName,
        toMemberName: recipient.memberName,
        messageId: deliveredMessageId,
      };
    },
    verify: async ({ destination, destinationMessageId, location }) => {
      const expectedLocation = isCrossTeamLocation(location)
        ? location
        : destination.kind === 'cross_team_outbox'
          ? {
              kind: 'cross_team_outbox' as const,
              fromTeamName: destination.fromTeamName,
              toTeamName: destination.toTeamName,
              toMemberName: destination.toMemberName,
              messageId: destinationMessageId,
            }
          : null;
      if (!expectedLocation) {
        return { found: false, location: null, diagnostics: ['destination kind mismatch'] };
      }
      const messages = await deps.sentMessagesStore.readMessages(expectedLocation.fromTeamName);
      const expectedRecipient = `${expectedLocation.toTeamName}.${expectedLocation.toMemberName}`;
      const found = messages.some(
        (message) =>
          message.messageId === expectedLocation.messageId && message.to === expectedRecipient
      );
      return {
        found,
        location: found ? expectedLocation : null,
        diagnostics: [],
      };
    },
    buildChangeEvent: ({ teamName }) => ({
      type: 'inbox',
      teamName,
      data: { detail: 'cross-team-outbox' },
    }),
  };

  return [userMessagesPort, memberInboxPort, crossTeamPort];
}
