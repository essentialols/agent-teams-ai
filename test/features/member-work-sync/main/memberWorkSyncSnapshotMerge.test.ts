import { mergeMemberWorkSyncSnapshots } from '@features/member-work-sync/main/infrastructure/memberWorkSyncSnapshotMerge';
import { describe, expect, it } from 'vitest';

import type {
  MemberWorkSyncOutboxItemRecord,
  MemberWorkSyncReportIntentRecord,
  MemberWorkSyncStatusRecord,
  MemberWorkSyncTeamSnapshotRecords,
} from '@features/internal-storage/contracts/internalStorageContracts';

const T0 = '2026-07-22T00:00:00.000Z';
const T1 = '2026-07-22T00:01:00.000Z';

function empty(): MemberWorkSyncTeamSnapshotRecords {
  return { statuses: [], reportIntents: [], outboxItems: [], metricEvents: [] };
}

function status(evaluatedAt: string, state: string): MemberWorkSyncStatusRecord {
  return {
    teamName: 'team-a',
    memberKey: 'bob',
    memberName: 'bob',
    state,
    evaluatedAt,
    providerId: null,
    statusJson: JSON.stringify({ state, evaluatedAt }),
  };
}

function report(statusValue: string, processedAt: string | null): MemberWorkSyncReportIntentRecord {
  return {
    teamName: 'team-a',
    id: 'intent-1',
    memberKey: 'bob',
    memberName: 'bob',
    status: statusValue,
    reason: 'test',
    recordedAt: T0,
    processedAt,
    resultCode: processedAt ? statusValue : null,
    requestJson: '{}',
  };
}

function outbox(
  statusValue: string,
  attemptGeneration: number,
  updatedAt: string
): MemberWorkSyncOutboxItemRecord {
  return {
    teamName: 'team-a',
    id: 'outbox-1',
    memberKey: 'bob',
    memberName: 'bob',
    agendaFingerprint: 'agenda-1',
    payloadHash: `hash-${statusValue}`,
    status: statusValue,
    attemptGeneration,
    claimedBy: null,
    claimedAt: null,
    deliveredMessageId: statusValue === 'delivered' ? 'message-1' : null,
    deliveryState: null,
    lastError: null,
    nextAttemptAt: null,
    createdAt: T0,
    updatedAt,
    workSyncIntent: 'agenda_sync',
    workSyncIntentKey: null,
    reviewRequestEventIdsJson: null,
    deliveryDiagnosticsJson: null,
    payloadJson: '{}',
  };
}

describe('mergeMemberWorkSyncSnapshots', () => {
  it('uses evaluatedAt as the status version and keeps live-overlay compatibility on valid ties', () => {
    expect(
      mergeMemberWorkSyncSnapshots(
        { ...empty(), statuses: [status(T0, 'caught_up')] },
        { ...empty(), statuses: [status(T1, 'needs_sync')] }
      ).statuses[0]?.state
    ).toBe('needs_sync');
    expect(
      mergeMemberWorkSyncSnapshots(
        { ...empty(), statuses: [status(T1, 'caught_up')] },
        { ...empty(), statuses: [status(T1, 'needs_sync')] }
      ).statuses[0]?.state
    ).toBe('needs_sync');
    expect(
      mergeMemberWorkSyncSnapshots(
        { ...empty(), statuses: [status(T1, 'caught_up')] },
        { ...empty(), statuses: [status('invalid', 'needs_sync')] }
      ).statuses[0]?.state
    ).toBe('caught_up');
  });

  it('never regresses processed report intents to pending', () => {
    const merged = mergeMemberWorkSyncSnapshots(
      { ...empty(), reportIntents: [report('accepted', T0)] },
      { ...empty(), reportIntents: [report('pending', null)] }
    );
    expect(merged.reportIntents[0]).toMatchObject({ status: 'accepted', processedAt: T0 });
  });

  it('never regresses delivery proof and otherwise uses generation then updatedAt', () => {
    const delivered = mergeMemberWorkSyncSnapshots(
      { ...empty(), outboxItems: [outbox('delivered', 1, T0)] },
      { ...empty(), outboxItems: [outbox('pending', 99, T1)] }
    );
    expect(delivered.outboxItems[0]?.status).toBe('delivered');

    const higherGeneration = mergeMemberWorkSyncSnapshots(
      { ...empty(), outboxItems: [outbox('pending', 1, T1)] },
      { ...empty(), outboxItems: [outbox('failed_retryable', 2, T0)] }
    );
    expect(higherGeneration.outboxItems[0]?.status).toBe('failed_retryable');

    const later = mergeMemberWorkSyncSnapshots(
      { ...empty(), outboxItems: [outbox('pending', 2, T0)] },
      { ...empty(), outboxItems: [outbox('superseded', 2, T1)] }
    );
    expect(later.outboxItems[0]?.status).toBe('superseded');
  });

  it('keeps live-overlay compatibility for duplicate metric ids and caps newest rows', () => {
    const canonical = Array.from({ length: 205 }, (_, index) => ({
      teamName: 'team-a',
      id: `metric-${String(index).padStart(3, '0')}`,
      memberKey: 'bob',
      memberName: 'bob',
      kind: 'status_evaluated',
      recordedAt: new Date(Date.parse(T0) + index).toISOString(),
      eventJson: JSON.stringify({ source: 'canonical', index }),
    }));
    const merged = mergeMemberWorkSyncSnapshots(
      { ...empty(), metricEvents: canonical },
      {
        ...empty(),
        metricEvents: [{ ...canonical[204]!, eventJson: JSON.stringify({ source: 'incoming' }) }],
      }
    );
    expect(merged.metricEvents).toHaveLength(200);
    expect(merged.metricEvents.at(-1)?.eventJson).toContain('incoming');
  });
});
