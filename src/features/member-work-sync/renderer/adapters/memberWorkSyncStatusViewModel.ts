import type { MemberWorkSyncStatus } from '../../contracts';
import type { useAppTranslation } from '@features/localization/renderer';

export type MemberWorkSyncViewTone = 'neutral' | 'success' | 'working' | 'attention' | 'blocked';

export interface MemberWorkSyncStatusViewModel {
  label: string;
  tone: MemberWorkSyncViewTone;
  actionableCount: number;
  tooltip: string;
  fingerprint?: string;
  leaseExpiresAt?: string;
  reportState?: string;
  wouldNudge?: boolean;
}

type TeamT = ReturnType<typeof useAppTranslation>['t'];

const defaultMemberWorkSyncText = {
  labels: {
    synced: 'Synced',
    working: 'Working',
    needsSync: 'Needs sync',
    blocked: 'Blocked',
    unknown: 'Unknown',
  },
  agendaItems: {
    zero: 'No actionable work items.',
    one: '1 actionable work item.',
    other: (count: number) => `${count} actionable work items.`,
  },
  tooltips: {
    notEvaluated: 'Member work sync status has not been evaluated yet.',
    synced: (agenda: string) => `Synced with current work agenda. ${agenda}`,
    working: (agenda: string) => `Member reported still working on current agenda. ${agenda}`,
    blocked: (agenda: string) => `Member reported blocked on current agenda. ${agenda}`,
    needsSync: (agenda: string) =>
      `Shadow status only: current agenda has no valid member report. ${agenda}`,
    inactive: (agenda: string) => `Member work sync is not active for this member. ${agenda}`,
  },
} as const;

function getDefaultMemberWorkSyncText(
  key: Parameters<TeamT>[0],
  options?: Record<string, unknown>
): string {
  const count = typeof options?.count === 'number' ? options.count : 0;
  const agenda = typeof options?.agenda === 'string' ? options.agenda : '';
  switch (key) {
    case 'memberWorkSync.status.labels.synced':
      return defaultMemberWorkSyncText.labels.synced;
    case 'memberWorkSync.status.labels.working':
      return defaultMemberWorkSyncText.labels.working;
    case 'memberWorkSync.status.labels.needsSync':
      return defaultMemberWorkSyncText.labels.needsSync;
    case 'memberWorkSync.status.labels.blocked':
      return defaultMemberWorkSyncText.labels.blocked;
    case 'memberWorkSync.status.labels.unknown':
      return defaultMemberWorkSyncText.labels.unknown;
    case 'memberWorkSync.status.agendaItems':
      if (count === 0) return defaultMemberWorkSyncText.agendaItems.zero;
      if (count === 1) return defaultMemberWorkSyncText.agendaItems.one;
      return defaultMemberWorkSyncText.agendaItems.other(count);
    case 'memberWorkSync.status.tooltips.notEvaluated':
      return defaultMemberWorkSyncText.tooltips.notEvaluated;
    case 'memberWorkSync.status.tooltips.synced':
      return defaultMemberWorkSyncText.tooltips.synced(agenda);
    case 'memberWorkSync.status.tooltips.working':
      return defaultMemberWorkSyncText.tooltips.working(agenda);
    case 'memberWorkSync.status.tooltips.blocked':
      return defaultMemberWorkSyncText.tooltips.blocked(agenda);
    case 'memberWorkSync.status.tooltips.needsSync':
      return defaultMemberWorkSyncText.tooltips.needsSync(agenda);
    case 'memberWorkSync.status.tooltips.inactive':
      return defaultMemberWorkSyncText.tooltips.inactive(agenda);
    default:
      return String(key);
  }
}

const defaultT = ((key: Parameters<TeamT>[0], options?: Record<string, unknown>) =>
  getDefaultMemberWorkSyncText(key, options)) as TeamT;

function describeAgenda(count: number, t: TeamT): string {
  return t('memberWorkSync.status.agendaItems', { count });
}

export function toMemberWorkSyncStatusViewModel(
  status: MemberWorkSyncStatus | null | undefined,
  t: TeamT = defaultT
): MemberWorkSyncStatusViewModel {
  if (!status) {
    return {
      label: t('memberWorkSync.status.labels.unknown'),
      tone: 'neutral',
      actionableCount: 0,
      tooltip: t('memberWorkSync.status.tooltips.notEvaluated'),
    };
  }

  const actionableCount = status.agenda.items.length;
  const base = {
    actionableCount,
    fingerprint: status.agenda.fingerprint,
    ...(status.report?.expiresAt ? { leaseExpiresAt: status.report.expiresAt } : {}),
    ...(status.report?.state ? { reportState: status.report.state } : {}),
    ...(status.shadow ? { wouldNudge: status.shadow.wouldNudge } : {}),
  };

  if (status.state === 'caught_up') {
    return {
      ...base,
      label: t('memberWorkSync.status.labels.synced'),
      tone: 'success',
      tooltip: t('memberWorkSync.status.tooltips.synced', {
        agenda: describeAgenda(actionableCount, t),
      }),
    };
  }

  if (status.state === 'still_working') {
    return {
      ...base,
      label: t('memberWorkSync.status.labels.working'),
      tone: 'working',
      tooltip: t('memberWorkSync.status.tooltips.working', {
        agenda: describeAgenda(actionableCount, t),
      }),
    };
  }

  if (status.state === 'blocked') {
    return {
      ...base,
      label: t('memberWorkSync.status.labels.blocked'),
      tone: 'blocked',
      tooltip: t('memberWorkSync.status.tooltips.blocked', {
        agenda: describeAgenda(actionableCount, t),
      }),
    };
  }

  if (status.state === 'needs_sync') {
    return {
      ...base,
      label: t('memberWorkSync.status.labels.needsSync'),
      tone: 'attention',
      tooltip: t('memberWorkSync.status.tooltips.needsSync', {
        agenda: describeAgenda(actionableCount, t),
      }),
    };
  }

  return {
    ...base,
    label: t('memberWorkSync.status.labels.unknown'),
    tone: 'neutral',
    tooltip: t('memberWorkSync.status.tooltips.inactive', {
      agenda: describeAgenda(actionableCount, t),
    }),
  };
}
