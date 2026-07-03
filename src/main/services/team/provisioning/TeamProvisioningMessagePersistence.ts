import type { InboxMessage } from '@shared/types';

export interface TeamProvisioningMessagePersistenceLogger {
  warn(message: string): void;
}

export interface TeamProvisioningMessageController {
  messages: {
    appendSentMessage(message: TeamProvisioningPersistedMessagePayload): unknown;
    sendMessage(message: TeamProvisioningPersistedInboxMessagePayload): unknown;
  };
}

export interface TeamProvisioningMessagePersistencePorts {
  createController(input: {
    teamName: string;
    claudeDir: string;
  }): TeamProvisioningMessageController;
  getClaudeBasePath(): string;
  logger: TeamProvisioningMessagePersistenceLogger;
}

export interface TeamProvisioningInboxMessagePersistencePorts
  extends TeamProvisioningMessagePersistencePorts {
  emitRuntimeDeliveryReplyAdvisoryRefresh(teamName: string, message: InboxMessage): void;
}

export interface TeamProvisioningPersistedMessagePayload {
  from: InboxMessage['from'];
  to: InboxMessage['to'];
  text: InboxMessage['text'];
  timestamp: InboxMessage['timestamp'];
  summary: InboxMessage['summary'];
  messageId: InboxMessage['messageId'];
  relayOfMessageId: InboxMessage['relayOfMessageId'];
  source: InboxMessage['source'];
  leadSessionId: InboxMessage['leadSessionId'];
  conversationId: InboxMessage['conversationId'];
  replyToConversationId: InboxMessage['replyToConversationId'];
  taskRefs: InboxMessage['taskRefs'];
  attachments: InboxMessage['attachments'];
  color: InboxMessage['color'];
  toolSummary: InboxMessage['toolSummary'];
  toolCalls: InboxMessage['toolCalls'];
  messageKind: InboxMessage['messageKind'];
  workSyncIntent: InboxMessage['workSyncIntent'];
  workSyncIntentKey: InboxMessage['workSyncIntentKey'];
  workSyncReviewRequestEventIds: InboxMessage['workSyncReviewRequestEventIds'];
  slashCommand: InboxMessage['slashCommand'];
  commandOutput: InboxMessage['commandOutput'];
}

export type TeamProvisioningPersistedInboxMessagePayload = Omit<
  TeamProvisioningPersistedMessagePayload,
  'to'
> & {
  member: string;
};

function mapControllerMessagePayload(message: InboxMessage): TeamProvisioningPersistedMessagePayload {
  return {
    from: message.from,
    to: message.to,
    text: message.text,
    timestamp: message.timestamp,
    summary: message.summary,
    messageId: message.messageId,
    relayOfMessageId: message.relayOfMessageId,
    source: message.source,
    leadSessionId: message.leadSessionId,
    conversationId: message.conversationId,
    replyToConversationId: message.replyToConversationId,
    taskRefs: message.taskRefs,
    attachments: message.attachments,
    color: message.color,
    toolSummary: message.toolSummary,
    toolCalls: message.toolCalls,
    messageKind: message.messageKind,
    workSyncIntent: message.workSyncIntent,
    workSyncIntentKey: message.workSyncIntentKey,
    workSyncReviewRequestEventIds: message.workSyncReviewRequestEventIds,
    slashCommand: message.slashCommand,
    commandOutput: message.commandOutput,
  };
}

function createControllerForTeam(
  teamName: string,
  ports: TeamProvisioningMessagePersistencePorts
): TeamProvisioningMessageController {
  return ports.createController({
    teamName,
    claudeDir: ports.getClaudeBasePath(),
  });
}

export function persistTeamProvisioningSentMessage(
  teamName: string,
  message: InboxMessage,
  ports: TeamProvisioningMessagePersistencePorts
): void {
  try {
    createControllerForTeam(teamName, ports).messages.appendSentMessage(
      mapControllerMessagePayload(message)
    );
  } catch (error) {
    ports.logger.warn(`[${teamName}] sent-message persist failed: ${String(error)}`);
  }
}

export function persistTeamProvisioningInboxMessage(
  teamName: string,
  recipient: string,
  message: InboxMessage,
  ports: TeamProvisioningInboxMessagePersistencePorts
): void {
  try {
    const { to: _to, ...payload } = mapControllerMessagePayload(message);
    createControllerForTeam(teamName, ports).messages.sendMessage({
      member: recipient,
      ...payload,
    });
    ports.emitRuntimeDeliveryReplyAdvisoryRefresh(teamName, message);
  } catch (error) {
    ports.logger.warn(
      `[${teamName}] inbox-message persist for ${recipient} failed: ${String(error)}`
    );
  }
}
