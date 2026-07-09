import { createHash } from "node:crypto";

import {
  isRunEventProviderKind,
  runEventProviderKindFromString,
} from "./run-provider-kind";
import {
  RunEventCompactionSafetyMode,
  RunEventRedactionStatus,
  RunEventSeverity,
  RunEventType,
  type JsonObject,
  type JsonValue,
  type RunEvent,
  type RunEventSource,
} from "./run-event-types";
import {
  coerceJsonObject,
  sanitizeRunEventPayload,
  stableJsonString,
} from "./run-event-payload";

export function makeRunEvent(input: {
  readonly runId: string;
  readonly jobId?: string;
  readonly type: RunEventType;
  readonly severity?: RunEventSeverity;
  readonly occurredAt: string;
  readonly observedAt?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly sequence?: number;
  readonly source: RunEventSource;
  readonly payload?: JsonObject;
  readonly idempotencyParts?: readonly JsonValue[];
}): RunEvent {
  const payload = sanitizeRunEventPayload(input.payload ?? {});
  const eventId = runEventId({
    runId: input.runId,
    ...(input.jobId === undefined ? {} : { jobId: input.jobId }),
    type: input.type,
    source: input.source,
    idempotencyParts: input.idempotencyParts ?? [payload],
  });
  return {
    schemaVersion: 1,
    eventId,
    runId: input.runId,
    ...(input.jobId === undefined ? {} : { jobId: input.jobId }),
    type: input.type,
    severity: input.severity ?? RunEventSeverity.Info,
    occurredAt: input.occurredAt,
    observedAt: input.observedAt ?? input.occurredAt,
    correlationId: input.correlationId ?? eventId,
    ...(input.causationId === undefined ? {} : { causationId: input.causationId }),
    ...(input.sequence === undefined ? {} : { sequence: input.sequence }),
    source: input.source,
    redaction: RunEventRedactionStatus.Safe,
    payload,
  };
}

export function parseRunEvent(value: unknown): RunEvent | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== 1) return null;
  if (
    typeof value.eventId !== "string" ||
    typeof value.runId !== "string" ||
    typeof value.type !== "string" ||
    typeof value.severity !== "string" ||
    typeof value.occurredAt !== "string" ||
    value.redaction !== RunEventRedactionStatus.Safe ||
    !isRecord(value.source) ||
    !isRecord(value.payload)
  ) {
    return null;
  }
  if (!isRunEventType(value.type)) return null;
  if (!isRunEventSeverity(value.severity)) return null;
  const providerKindText = value.source.providerKind;
  if (typeof providerKindText !== "string") return null;
  const providerKind = isRunEventProviderKind(providerKindText)
    ? providerKindText
    : runEventProviderKindFromString(providerKindText);
  if (!optionalString(value.jobId)) return null;
  if (!optionalString(value.observedAt)) return null;
  if (!optionalString(value.correlationId)) return null;
  if (!optionalString(value.causationId)) return null;
  if (!optionalNumber(value.sequence)) return null;
  if (!optionalString(value.source.hostId)) return null;
  if (!optionalString(value.source.registryRootDir)) return null;
  if (!optionalString(value.source.workspaceKey)) return null;
  const payload = coerceJsonObject(value.payload);
  if (!payload) return null;
  return {
    schemaVersion: 1,
    eventId: value.eventId,
    runId: value.runId,
    ...(value.jobId === undefined ? {} : { jobId: value.jobId }),
    type: value.type,
    severity: value.severity,
    occurredAt: value.occurredAt,
    observedAt: value.observedAt ?? value.occurredAt,
    correlationId: value.correlationId ?? value.eventId,
    ...(value.causationId === undefined ? {} : { causationId: value.causationId }),
    ...(value.sequence === undefined ? {} : { sequence: value.sequence }),
    source: {
      providerKind,
      ...(value.source.hostId === undefined ? {} : { hostId: value.source.hostId }),
      ...(value.source.registryRootDir === undefined
        ? {}
        : { registryRootDir: value.source.registryRootDir }),
      ...(value.source.workspaceKey === undefined
        ? {}
        : { workspaceKey: value.source.workspaceKey }),
    },
    redaction: RunEventRedactionStatus.Safe,
    payload: sanitizeRunEventPayload(payload),
  };
}

function runEventId(input: {
  readonly runId: string;
  readonly jobId?: string;
  readonly type: RunEventType;
  readonly source: RunEventSource;
  readonly idempotencyParts: readonly JsonValue[];
}): string {
  const material = stableJsonString({
    runId: input.runId,
    jobId: input.jobId ?? null,
    type: input.type,
    source: {
      providerKind: input.source.providerKind,
      hostId: input.source.hostId ?? null,
      registryRootDir: input.source.registryRootDir ?? null,
      workspaceKey: input.source.workspaceKey ?? null,
    },
    idempotencyParts: input.idempotencyParts,
  });
  return createHash("sha256").update(material).digest("hex");
}

export function isRunEventType(value: string): value is RunEventType {
  return Object.values(RunEventType).includes(value as RunEventType);
}

export function isRunEventCompactionSafetyMode(
  value: string,
): value is RunEventCompactionSafetyMode {
  return Object.values(RunEventCompactionSafetyMode).includes(
    value as RunEventCompactionSafetyMode,
  );
}

function isRunEventSeverity(value: string): value is RunEventSeverity {
  return Object.values(RunEventSeverity).includes(value as RunEventSeverity);
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function optionalNumber(value: unknown): value is number | undefined {
  return value === undefined ||
    (typeof value === "number" && Number.isFinite(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
