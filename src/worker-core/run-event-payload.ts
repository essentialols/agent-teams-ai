import type {
  RunCapacityHint,
  RunControlInboxSummary,
  RunObservationSnapshot,
  RunObservationWorkspace,
} from "./run-observability";
import type { RunEventProviderKind } from "./run-provider-kind";
import {
  RunEventSeverity,
  type JsonObject,
  type JsonValue,
  type RunEventSource,
} from "./run-event-types";

export function sanitizeRunEventPayload(input: JsonObject): JsonObject {
  return sanitizeJsonObject(input, 0);
}

export function runEventSourceFromSnapshot(input: {
  readonly snapshot: RunObservationSnapshot;
  readonly providerKind: RunEventProviderKind;
  readonly hostId?: string;
  readonly registryRootDir?: string;
}): RunEventSource {
  return {
    providerKind: input.providerKind,
    ...(input.hostId === undefined ? {} : { hostId: input.hostId }),
    ...(input.registryRootDir === undefined
      ? {}
      : { registryRootDir: input.registryRootDir }),
    ...(input.snapshot.workspace?.key === undefined
      ? {}
      : { workspaceKey: input.snapshot.workspace.key }),
  };
}

export function snapshotPayload(snapshot: RunObservationSnapshot): JsonObject {
  return compactJsonObject({
    status: snapshot.status,
    liveness: snapshot.liveness,
    classification: snapshot.classification,
    recommendedAction: snapshot.recommendedAction,
    readOnlyDecision: {
      kind: snapshot.readOnlyDecision.kind,
      reason: snapshot.readOnlyDecision.reason,
    },
  });
}

export function resultSeverity(status: string | undefined): RunEventSeverity {
  if (status === "failed") return RunEventSeverity.Critical;
  if (status === "blocked") return RunEventSeverity.Blocked;
  return RunEventSeverity.Info;
}

export function decisionSeverity(kind: string): RunEventSeverity {
  if (kind === "unsafe_state_mismatch") return RunEventSeverity.Critical;
  if (
    kind === "manual_review_required" ||
    kind === "capacity_blocked" ||
    kind === "stale_needs_inspection"
  ) {
    return RunEventSeverity.Blocked;
  }
  return RunEventSeverity.Info;
}

export function capacitySeverity(
  capacity: readonly RunCapacityHint[] | undefined,
): RunEventSeverity {
  return capacity?.some((item) =>
    item.availability === "cooldown" ||
    item.status === "blocked" ||
    item.status === "invalid"
  ) ? RunEventSeverity.Blocked : RunEventSeverity.Info;
}

export function controlInboxSeverity(
  controlInbox: RunControlInboxSummary | undefined,
): RunEventSeverity {
  if ((controlInbox?.blockedDeliveryCount ?? 0) > 0) {
    return RunEventSeverity.Warning;
  }
  return RunEventSeverity.Info;
}

export function workspacePayload(
  workspace: RunObservationWorkspace | undefined,
): JsonObject {
  return compactJsonObject({
    path: workspace?.path,
    key: workspace?.key,
    exists: workspace?.exists,
    dirty: workspace?.dirty,
    changedFilesCount: workspace?.changedFilesCount,
    changedFiles: jsonArray(workspace?.changedFiles?.slice(0, 200)),
    warning: workspace?.warning,
  });
}

export function workspaceSignature(
  workspace: RunObservationWorkspace | undefined,
): string | undefined {
  if (!workspace) return undefined;
  return stableJsonString(compactJsonObject({
    dirty: workspace.dirty,
    changedFilesCount: workspace.changedFilesCount,
    changedFiles: [...(workspace.changedFiles ?? [])].sort(),
  }));
}

export function capacityPayload(
  capacity: readonly RunCapacityHint[] | undefined,
): readonly JsonObject[] {
  return [...(capacity ?? [])]
    .map((item) =>
      compactJsonObject({
        account: maskAccountIdentity(item.account),
        status: item.status,
        availability: item.availability,
        reason: item.reason,
        cooldownUntil: item.cooldownUntil,
        warning: item.warning,
      })
    )
    .sort((left, right) =>
      String(left.account ?? "").localeCompare(String(right.account ?? ""))
    );
}

export function controlInboxPayload(
  controlInbox: RunControlInboxSummary | undefined,
): JsonObject {
  return compactJsonObject({
    pendingCount: controlInbox?.pendingCount,
    acceptedCount: controlInbox?.acceptedCount,
    deliverableCount: controlInbox?.deliverableCount,
    deliveredCount: controlInbox?.deliveredCount,
    failedCount: controlInbox?.failedCount,
    blockedDeliveryCount: controlInbox?.blockedDeliveryCount,
    safeToContinue: controlInbox?.safeToContinue,
    latestSignalAt: controlInbox?.latestSignalAt,
    latestDeliveredAt: controlInbox?.latestDeliveredAt,
  });
}

export function compactJsonObject(
  input: Readonly<Record<string, JsonValue | undefined>>,
): JsonObject {
  const entries = Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, value as JsonValue] as const);
  return Object.fromEntries(entries) as JsonObject;
}

export function jsonArray(value: readonly string[] | undefined): readonly JsonValue[] | undefined {
  return value?.map((item) => item);
}

function sanitizeJsonObject(input: JsonObject, depth: number): JsonObject {
  if (depth > 12) return {};
  const output: Record<string, JsonValue> = {};
  for (const [key, value] of Object.entries(input).slice(0, 200)) {
    if (isSensitiveKey(key)) {
      output[key] = "<redacted>";
      continue;
    }
    output[key] = sanitizeJsonValue(value, depth + 1);
  }
  return output;
}

function sanitizeJsonValue(value: JsonValue, depth: number): JsonValue {
  if (typeof value === "string") {
    return value.length > 4_096 ? `${value.slice(0, 4_096)}<truncated>` : value;
  }
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    if (depth > 12) return [];
    return value.slice(0, 500).map((item) => sanitizeJsonValue(item, depth + 1));
  }
  return sanitizeJsonObject(value as JsonObject, depth);
}

function isSensitiveKey(key: string): boolean {
  return /(api[_-]?key|apiKey|apiToken|token|secret|credential|cookie|authorization|authJson|authPayload|auth[_-]?json|auth[_-]?payload)/i
    .test(key);
}

export function maskAccountIdentity(value: string | undefined): string | undefined {
  if (value === undefined || !value.trim()) return undefined;
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  if (at < 0) {
    return trimmed.length <= 4
      ? "***"
      : `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  return `${maskPart(local)}@${maskDomain(domain)}`;
}

function maskPart(value: string): string {
  if (value.length <= 2) return `${value[0] ?? ""}***`;
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function maskDomain(value: string): string {
  const [name = "", ...rest] = value.split(".");
  const suffix = rest.length === 0 ? "" : `.${rest.join(".")}`;
  return `${maskPart(name)}${suffix}`;
}

export function uniqueStrings(items: readonly string[]): readonly string[] {
  return [...new Set(items)].sort((left, right) => left.localeCompare(right));
}

export function isString(value: string | undefined): value is string {
  return value !== undefined;
}

export function stableJsonString(value: JsonValue): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: JsonValue): JsonValue {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortJsonValue);
  const sorted: Record<string, JsonValue> = {};
  const objectValue = value as JsonObject;
  for (const key of Object.keys(objectValue).sort()) {
    sorted[key] = sortJsonValue(objectValue[key] ?? null);
  }
  return sorted;
}

export function coerceJsonObject(value: unknown): JsonObject | null {
  if (!isRecord(value)) return null;
  const output: Record<string, JsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    const coerced = coerceJsonValue(item);
    if (coerced === undefined) return null;
    output[key] = coerced;
  }
  return output;
}

function coerceJsonValue(value: unknown): JsonValue | undefined {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (Array.isArray(value)) {
    const items: JsonValue[] = [];
    for (const item of value) {
      const coerced = coerceJsonValue(item);
      if (coerced === undefined) return undefined;
      items.push(coerced);
    }
    return items;
  }
  if (isRecord(value)) return coerceJsonObject(value) ?? undefined;
  return undefined;
}

export function stringFromJson(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function numberFromJson(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function booleanFromJson(value: JsonValue | undefined): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function objectFromJson(value: JsonValue | undefined): JsonObject | undefined {
  return value !== undefined && value !== null &&
      typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : undefined;
}

export function objectArrayFromJson(
  value: JsonValue | undefined,
): readonly JsonObject[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const output = value.filter((item): item is JsonObject =>
    item !== null && typeof item === "object" && !Array.isArray(item)
  );
  return output.length === value.length ? output : undefined;
}

export function stringArrayFromJson(value: JsonValue | undefined): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
