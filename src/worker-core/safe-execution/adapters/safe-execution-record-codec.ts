import { attemptFailureReasons } from "../domain/safe-execution-policy";
import type {
  AttemptPatchStats,
  AttemptPatchStatsSource,
  AttemptRecord,
  AttemptStatus,
  AttemptUsage,
  AttemptUsageSource,
  SafeExecutionTaskRecord,
  SafeExecutionTaskStatus,
} from "../domain/safe-execution-task";
import type {
  AttemptFailureReason,
  TaskEffectMode,
} from "../domain/safe-execution-policy";

export function serializeTaskRecord(
  record: SafeExecutionTaskRecord,
): Readonly<Record<string, unknown>> {
  return {
    ...record,
    startedAt: record.startedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    completedAt: record.completedAt?.toISOString(),
    attempts: record.attempts.map(serializeAttemptRecord),
  };
}

export function parseTaskRecord(raw: string): SafeExecutionTaskRecord {
  const value = JSON.parse(raw) as Record<string, unknown>;
  return {
    taskId: requireString(value.taskId, "taskId"),
    workspaceRunId: requireString(value.workspaceRunId, "workspaceRunId"),
    workspacePath: requireString(value.workspacePath, "workspacePath"),
    effectMode: requireEffectMode(value.effectMode),
    provider: requireString(value.provider, "provider"),
    status: requireTaskStatus(value.status),
    startedAt: requireDate(value.startedAt, "startedAt"),
    updatedAt: requireDate(value.updatedAt, "updatedAt"),
    attempts: arrayValue(value.attempts).map(parseAttemptRecord),
    ...(dateValue(value.completedAt) === undefined
      ? {}
      : { completedAt: requireDate(value.completedAt, "completedAt") }),
    ...(value.result === undefined ? {} : { result: value.result }),
    ...(stringValue(value.outputSummary) === undefined
      ? {}
      : { outputSummary: stringValue(value.outputSummary)! }),
    ...(isAttemptFailureReason(value.lastFailureReason)
      ? { lastFailureReason: value.lastFailureReason }
      : {}),
    ...(stringValue(value.lastFailureMessage) === undefined
      ? {}
      : { lastFailureMessage: stringValue(value.lastFailureMessage)! }),
    ...(stringRecordValue(value.lastFailureDetails) === undefined
      ? {}
      : { lastFailureDetails: stringRecordValue(value.lastFailureDetails)! }),
  };
}

function serializeAttemptRecord(
  record: AttemptRecord,
): Readonly<Record<string, unknown>> {
  return {
    ...record,
    startedAt: record.startedAt.toISOString(),
    finishedAt: record.finishedAt?.toISOString(),
  };
}

function parseAttemptRecord(value: unknown): AttemptRecord {
  const record = value as Record<string, unknown>;
  return {
    taskId: requireString(record.taskId, "attempt.taskId"),
    attemptNumber: requireNumber(record.attemptNumber, "attempt.attemptNumber"),
    ...(stringValue(record.workerId) === undefined
      ? {}
      : { workerId: stringValue(record.workerId)! }),
    ...(stringValue(record.accountId) === undefined
      ? {}
      : { accountId: stringValue(record.accountId)! }),
    provider: requireString(record.provider, "attempt.provider"),
    startedAt: requireDate(record.startedAt, "attempt.startedAt"),
    ...(dateValue(record.finishedAt) === undefined
      ? {}
      : { finishedAt: requireDate(record.finishedAt, "attempt.finishedAt") }),
    status: requireAttemptStatus(record.status),
    ...(isAttemptFailureReason(record.failureReason)
      ? { failureReason: record.failureReason }
      : {}),
    ...(stringValue(record.failureMessage) === undefined
      ? {}
      : { failureMessage: stringValue(record.failureMessage)! }),
    ...(stringRecordValue(record.failureDetails) === undefined
      ? {}
      : { failureDetails: stringRecordValue(record.failureDetails)! }),
    workspaceDirtyBefore: Boolean(record.workspaceDirtyBefore),
    ...(typeof record.workspaceDirtyAfter === "boolean"
      ? { workspaceDirtyAfter: record.workspaceDirtyAfter }
      : {}),
    changedFiles: arrayValue(record.changedFiles).map((item) =>
      requireString(item, "attempt.changedFiles"),
    ),
    ...(parseAttemptUsage(record.usage) === undefined
      ? {}
      : { usage: parseAttemptUsage(record.usage)! }),
    ...(isAttemptUsageSource(record.usageSource)
      ? { usageSource: record.usageSource }
      : {}),
    ...(parseAttemptPatchStats(record.patch) === undefined
      ? {}
      : { patch: parseAttemptPatchStats(record.patch)! }),
    ...(stringValue(record.lastOutputSummary) === undefined
      ? {}
      : { lastOutputSummary: stringValue(record.lastOutputSummary)! }),
  };
}

function parseAttemptUsage(value: unknown): AttemptUsage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const inputTokens = numberValue(record.inputTokens);
  const outputTokens = numberValue(record.outputTokens);
  const totalTokens = numberValue(record.totalTokens);
  if (
    inputTokens === undefined &&
    outputTokens === undefined &&
    totalTokens === undefined
  ) {
    return undefined;
  }
  return {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}

function parseAttemptPatchStats(
  value: unknown,
): AttemptPatchStats | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const additions = numberValue(record.additions);
  const deletions = numberValue(record.deletions);
  const source = record.source;
  if (
    additions === undefined ||
    deletions === undefined ||
    !isAttemptPatchStatsSource(source)
  ) {
    return undefined;
  }
  return { additions, deletions, source };
}

function requireString(value: unknown, field: string): string {
  const normalized = stringValue(value);
  if (normalized !== undefined) return normalized;
  throw new Error(`safe_execution_invalid_${field}`);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function requireNumber(value: unknown, field: string): number {
  const normalized = numberValue(value);
  if (normalized !== undefined) return normalized;
  throw new Error(`safe_execution_invalid_${field}`);
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringRecordValue(
  value: unknown,
): Readonly<Record<string, string>> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const record: Record<string, string> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (typeof nested !== "string") return undefined;
    record[key] = nested;
  }
  return record;
}

function requireDate(value: unknown, field: string): Date {
  const normalized = dateValue(value);
  if (normalized !== undefined) return normalized;
  throw new Error(`safe_execution_invalid_${field}`);
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function arrayValue(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function requireEffectMode(value: unknown): TaskEffectMode {
  if (
    value === "read_only" ||
    value === "workspace_patch" ||
    value === "external_side_effects"
  ) {
    return value;
  }
  throw new Error("safe_execution_invalid_effectMode");
}

function requireTaskStatus(value: unknown): SafeExecutionTaskStatus {
  if (
    value === "running" ||
    value === "completed" ||
    value === "waiting_capacity" ||
    value === "partial" ||
    value === "failed" ||
    value === "aborted"
  ) {
    return value;
  }
  throw new Error("safe_execution_invalid_status");
}

function requireAttemptStatus(value: unknown): AttemptStatus {
  if (
    value === "running" ||
    value === "completed" ||
    value === "blocked" ||
    value === "failed"
  ) {
    return value;
  }
  throw new Error("safe_execution_invalid_attempt_status");
}

function isAttemptFailureReason(value: unknown): value is AttemptFailureReason {
  return (
    typeof value === "string" &&
    attemptFailureReasons.includes(value as AttemptFailureReason)
  );
}

function isAttemptUsageSource(value: unknown): value is AttemptUsageSource {
  return (
    value === "provider_structured" ||
    value === "legacy_text_reported" ||
    value === "unavailable"
  );
}

function isAttemptPatchStatsSource(
  value: unknown,
): value is AttemptPatchStatsSource {
  return (
    value === "git_numstat_delta" ||
    value === "git_numstat_delta_dirty_baseline" ||
    value === "unavailable"
  );
}
