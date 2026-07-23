import { validateMemberName, validateTaskId, validateTeamName } from '@main/ipc/guards';

import { executeTeamRuntimeOperation } from './executeTeamRuntimeOperation';

import type { TeamTaskLogQuery } from '../../../../core/application/ports/TeamRuntimeOperationPorts';
import type { TeamRuntimeOperationsFeature } from '../../../composition/createTeamRuntimeOperationsFeature';
import type {
  IpcResult,
  MemberFullStats,
  MemberLogSummary,
  TeamClaudeLogsQuery,
  TeamClaudeLogsResponse,
} from '@shared/types';
import type { IpcMainInvokeEvent } from 'electron';

export interface TeamRuntimeLogIpcHandlers {
  getClaudeLogs(
    event: IpcMainInvokeEvent,
    teamName: unknown,
    query?: unknown
  ): Promise<IpcResult<TeamClaudeLogsResponse>>;
  getMemberLogs(
    event: IpcMainInvokeEvent,
    teamName: unknown,
    memberName: unknown
  ): Promise<IpcResult<MemberLogSummary[]>>;
  getLogsForTask(
    event: IpcMainInvokeEvent,
    teamName: unknown,
    taskId: unknown,
    options?: unknown
  ): Promise<IpcResult<MemberLogSummary[]>>;
  getMemberStats(
    event: IpcMainInvokeEvent,
    teamName: unknown,
    memberName: unknown
  ): Promise<IpcResult<MemberFullStats>>;
}

function normalizeClaudeLogsQuery(query: unknown):
  | { valid: true; value: TeamClaudeLogsQuery | undefined }
  | {
      valid: false;
      error: string;
    } {
  if (query === undefined) return { valid: true, value: undefined };
  if (!query || typeof query !== 'object') {
    return { valid: false, error: 'query must be an object' };
  }
  const value = query as Record<string, unknown>;
  return {
    valid: true,
    value: {
      offset: typeof value.offset === 'number' ? value.offset : undefined,
      limit: typeof value.limit === 'number' ? value.limit : undefined,
    },
  };
}

function normalizeTaskLogQuery(options: unknown): TeamTaskLogQuery | undefined {
  if (!options || typeof options !== 'object') {
    return undefined;
  }
  const value = options as Record<string, unknown>;
  return {
    owner: typeof value.owner === 'string' ? value.owner : undefined,
    status: typeof value.status === 'string' ? value.status : undefined,
    since: typeof value.since === 'string' ? value.since : undefined,
    intervals: Array.isArray(value.intervals)
      ? value.intervals.filter(
          (interval): interval is { startedAt: string; completedAt?: string } =>
            Boolean(interval) &&
            typeof interval === 'object' &&
            typeof (interval as Record<string, unknown>).startedAt === 'string' &&
            ((interval as Record<string, unknown>).completedAt === undefined ||
              typeof (interval as Record<string, unknown>).completedAt === 'string')
        )
      : undefined,
  };
}

export function createTeamRuntimeLogIpcHandlers(
  feature: TeamRuntimeOperationsFeature
): TeamRuntimeLogIpcHandlers {
  return {
    getClaudeLogs: async (_event, teamName, query) => {
      const team = validateTeamName(teamName);
      if (!team.valid) {
        return { success: false, error: team.error ?? 'Invalid teamName' };
      }
      const normalizedQuery = normalizeClaudeLogsQuery(query);
      if (!normalizedQuery.valid) {
        return { success: false, error: normalizedQuery.error };
      }
      return executeTeamRuntimeOperation(feature.logger, 'getClaudeLogs', () =>
        feature.logs.getClaudeLogs(team.value!, normalizedQuery.value)
      );
    },
    getMemberLogs: async (_event, teamName, memberName) => {
      const team = validateTeamName(teamName);
      if (!team.valid) {
        return { success: false, error: team.error ?? 'Invalid teamName' };
      }
      const member = validateMemberName(memberName);
      if (!member.valid) {
        return { success: false, error: member.error ?? 'Invalid memberName' };
      }
      return executeTeamRuntimeOperation(feature.logger, 'getMemberLogs', () =>
        feature.logs.getMemberLogs(team.value!, member.value!)
      );
    },
    getLogsForTask: async (_event, teamName, taskId, options) => {
      const team = validateTeamName(teamName);
      if (!team.valid) {
        return { success: false, error: team.error ?? 'Invalid teamName' };
      }
      const task = validateTaskId(taskId);
      if (!task.valid) {
        return { success: false, error: task.error ?? 'Invalid taskId' };
      }
      return executeTeamRuntimeOperation(feature.logger, 'getLogsForTask', () =>
        feature.logs.getLogsForTask(team.value!, task.value!, normalizeTaskLogQuery(options))
      );
    },
    getMemberStats: async (_event, teamName, memberName) => {
      const team = validateTeamName(teamName);
      if (!team.valid) {
        return { success: false, error: team.error ?? 'Invalid teamName' };
      }
      const member = validateMemberName(memberName);
      if (!member.valid) {
        return { success: false, error: member.error ?? 'Invalid memberName' };
      }
      return executeTeamRuntimeOperation(feature.logger, 'getMemberStats', () =>
        feature.logs.getMemberStats(team.value!, member.value!)
      );
    },
  };
}
