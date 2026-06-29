import { classifyOpenCodeRuntimeDeliveryReasonCode } from '../opencode/delivery/OpenCodeRuntimeDeliveryAdvisoryPolicy';
import {
  normalizeOpenCodeTaskRefsForComparison,
  openCodeTaskRefKey,
} from '../opencode/delivery/OpenCodeRuntimeDeliveryProofMatching';

import type { OpenCodePromptDeliveryLedgerRecord } from '../opencode/delivery/OpenCodePromptDeliveryLedger';
import type { InboxMessage, TaskRef } from '@shared/types';

export type InboxRelayComparableMessage = Pick<
  InboxMessage,
  'messageKind' | 'source' | 'timestamp'
> & { messageId: string };

export function normalizeSameTeamText(text: string): string {
  return text.trim().replace(/\r\n/g, '\n');
}

const SUPPRESSED_LEAD_RELAY_STATE_PHRASES = [
  'open',
  'closed',
  'merged',
  'approved',
  'complete',
  'completed',
  'done',
  'blocked',
  'pending',
  'in_progress',
  'in progress',
  'needsfix',
  'needs fix',
  'in review',
  'clear',
] as const;

function startsWithSuppressedLeadRelayStatePhrase(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SUPPRESSED_LEAD_RELAY_STATE_PHRASES.some((phrase) => {
    if (!lowerText.startsWith(phrase)) {
      return false;
    }

    const nextChar = lowerText.charAt(phrase.length);
    return nextChar.length === 0 || !/[a-z0-9_]/i.test(nextChar);
  });
}

function hasSuppressedLeadRelayStatePredicate(normalized: string): boolean {
  const match = /\b(?:is|are|was|were|stays?|still|now)\s+/i.exec(normalized);
  if (!match) {
    return false;
  }

  return startsWithSuppressedLeadRelayStatePhrase(normalized.slice(match.index + match[0].length));
}

export function shouldSuppressUnverifiedLeadRelayStateLine(text: string): boolean {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) {
    return false;
  }

  const hasStateSubject =
    /#[a-z0-9]{4,}/i.test(normalized) ||
    /\bpr\s*#?\d+\b/i.test(normalized) ||
    /\bpull request\b/i.test(normalized) ||
    /\b(?:task|tasks|kanban|board|review|approval|merge|merged|branch|queue|worktree|commit|mergecommit|mergedat)\b/i.test(
      normalized
    );
  if (!hasStateSubject) {
    return false;
  }

  return (
    /\b(?:confirmed|verified|already|claims?|false|phantom|ground[- ]truth)\b/i.test(normalized) ||
    /\b(?:done|complete(?:d)?|approved|merged|closed|blocked|resolved|failed|succeeded)\b/i.test(
      normalized
    ) ||
    hasSuppressedLeadRelayStatePredicate(normalized) ||
    /\b(?:mergecommit|mergedat)\s*=\s*(?:null|[^\s,;]+)/i.test(normalized) ||
    /\bqueue\b.*\bclear\b/i.test(normalized)
  );
}

export function getOpenCodeInboxRelayPriority(
  message: Pick<InboxMessage, 'messageKind' | 'source'>
): number {
  if (message.messageKind === 'member_work_sync_nudge') {
    return 30;
  }
  if (message.source === 'system_notification') {
    return 20;
  }
  return 0;
}

export function getMemberInboxRelayPriority(
  message: Pick<InboxMessage, 'messageKind' | 'source'>
): number {
  if (message.messageKind === 'member_work_sync_nudge') {
    return 30;
  }
  return 0;
}

export function getLeadInboxRelayPriority(message: Pick<InboxMessage, 'messageKind'>): number {
  return message.messageKind === 'member_work_sync_nudge' ? 30 : 0;
}

function compareInboxRelayMessages(
  a: InboxRelayComparableMessage,
  b: InboxRelayComparableMessage,
  getPriority: (message: Pick<InboxMessage, 'messageKind' | 'source'>) => number
): number {
  const priorityDelta = getPriority(b) - getPriority(a);
  if (priorityDelta !== 0) return priorityDelta;
  const aTime = Date.parse(a.timestamp);
  const bTime = Date.parse(b.timestamp);
  if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
    const timeDelta = aTime - bTime;
    if (timeDelta !== 0) return timeDelta;
  } else if (Number.isFinite(aTime)) {
    return -1;
  } else if (Number.isFinite(bTime)) {
    return 1;
  }
  return a.messageId.localeCompare(b.messageId);
}

export function compareOpenCodeInboxRelayMessagesByPriority(
  a: InboxRelayComparableMessage,
  b: InboxRelayComparableMessage
): number {
  return compareInboxRelayMessages(a, b, getOpenCodeInboxRelayPriority);
}

export function compareMemberInboxRelayMessagesByPriority(
  a: InboxRelayComparableMessage,
  b: InboxRelayComparableMessage
): number {
  return compareInboxRelayMessages(a, b, getMemberInboxRelayPriority);
}

export function compareLeadInboxRelayMessagesByPriority(
  a: InboxRelayComparableMessage,
  b: InboxRelayComparableMessage
): number {
  return compareInboxRelayMessages(a, b, getLeadInboxRelayPriority);
}

export function hasStableInboxMessageId(
  message: InboxMessage
): message is InboxMessage & { messageId: string } {
  return typeof message.messageId === 'string' && message.messageId.trim().length > 0;
}

export function isOpenCodeProtocolProofMissingRecord(
  record: OpenCodePromptDeliveryLedgerRecord
): boolean {
  return [record.lastReason, ...record.diagnostics].some(
    (reason) =>
      typeof reason === 'string' &&
      classifyOpenCodeRuntimeDeliveryReasonCode(reason) === 'protocol_proof_missing'
  );
}

export function openCodeTaskRefsOverlap(
  left: readonly TaskRef[] | undefined,
  right: readonly TaskRef[] | undefined
): boolean {
  const leftRefs = normalizeOpenCodeTaskRefsForComparison(left);
  const rightRefs = normalizeOpenCodeTaskRefsForComparison(right);
  if (leftRefs.length === 0 || rightRefs.length === 0) {
    return false;
  }
  const rightKeys = new Set(rightRefs.map((taskRef) => openCodeTaskRefKey(taskRef)));
  return leftRefs.some((taskRef) => rightKeys.has(openCodeTaskRefKey(taskRef)));
}

export function openCodeReviewPickupRequestTextMentionsTask(input: {
  summary: string;
  text: string;
  taskRef: TaskRef;
}): boolean {
  const displayId = input.taskRef.displayId.trim();
  const taskId = input.taskRef.taskId.trim();
  const haystack = `${input.summary}\n${input.text}`;
  return (
    (displayId.length > 0 &&
      (haystack.includes(`#${displayId}`) || haystack.includes(`task #${displayId}`))) ||
    (taskId.length > 0 && haystack.includes(taskId))
  );
}

export function isCurrentReviewPickupRequestForegroundMessage(
  message: InboxMessage,
  input: { workSyncIntent?: 'agenda_sync' | 'review_pickup'; taskRefs?: TaskRef[] }
): boolean {
  if (input.workSyncIntent !== 'review_pickup') {
    return false;
  }
  if (message.source !== 'system_notification') {
    return false;
  }

  const expectedRefs = normalizeOpenCodeTaskRefsForComparison(input.taskRefs);
  if (expectedRefs.length === 0) {
    return false;
  }

  const summary = typeof message.summary === 'string' ? message.summary.trim() : '';
  const text = typeof message.text === 'string' ? message.text : '';
  const looksLikeReviewRequest =
    summary.startsWith('Review request for #') ||
    (text.includes('**Please review**') && text.includes('review_start'));
  if (!looksLikeReviewRequest) {
    return false;
  }

  const messageRefs = normalizeOpenCodeTaskRefsForComparison(message.taskRefs);
  if (messageRefs.length > 0) {
    const expectedKeys = new Set(expectedRefs.map((taskRef) => openCodeTaskRefKey(taskRef)));
    return messageRefs.some((taskRef) => expectedKeys.has(openCodeTaskRefKey(taskRef)));
  }

  return expectedRefs.some((taskRef) =>
    openCodeReviewPickupRequestTextMentionsTask({ summary, text, taskRef })
  );
}

export function isCurrentProofMissingRecoveryForegroundMessage(
  message: InboxMessage,
  input: { workSyncIntent?: 'agenda_sync' | 'review_pickup'; workSyncIntentKey?: string }
): boolean {
  if (input.workSyncIntent !== 'agenda_sync') {
    return false;
  }

  const prefix = 'proof-missing:';
  const intentKey = input.workSyncIntentKey?.trim();
  if (!intentKey?.startsWith(prefix)) {
    return false;
  }

  const originalMessageId = intentKey.slice(prefix.length).trim();
  return hasStableInboxMessageId(message) && message.messageId.trim() === originalMessageId;
}

export function isUserOriginatedLeadRelayMessage(message: InboxMessage): boolean {
  const from = typeof message.from === 'string' ? message.from.trim().toLowerCase() : '';
  return from === 'user' || message.source === 'user_sent';
}

export async function getLeadRelayReadCommitBatch(input: {
  teamName: string;
  leadName: string;
  batch: (InboxMessage & { messageId: string })[];
  hasAcceptedLeadWorkSyncReport: (input: {
    teamName: string;
    leadName: string;
  }) => Promise<boolean>;
  scheduleLeadProofMissingWorkSyncRecovery: (input: {
    teamName: string;
    leadName: string;
    message: InboxMessage & { messageId: string };
  }) => Promise<boolean>;
}): Promise<(InboxMessage & { messageId: string })[]> {
  const readCommitBatch: (InboxMessage & { messageId: string })[] = [];
  for (const message of input.batch) {
    if (message.messageKind !== 'member_work_sync_nudge') {
      readCommitBatch.push(message);
      continue;
    }

    if (
      await input.hasAcceptedLeadWorkSyncReport({
        teamName: input.teamName,
        leadName: input.leadName,
      })
    ) {
      readCommitBatch.push(message);
      continue;
    }

    const recoveryScheduled = await input.scheduleLeadProofMissingWorkSyncRecovery({
      teamName: input.teamName,
      leadName: input.leadName,
      message,
    });
    if (recoveryScheduled) {
      readCommitBatch.push(message);
    }
  }
  return readCommitBatch;
}
