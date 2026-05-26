import { createSafeError, type SafeError } from "../errors/safe-error.js";
import { err, ok, type Result } from "../result/result.js";

import type { OpaqueId } from "./brand.js";

const INVALID_OPAQUE_ID = "CONTROL_PLANE_INVALID_OPAQUE_ID";

export type WorkspaceId = OpaqueId<"WorkspaceId">;
export type DesktopClientId = OpaqueId<"DesktopClientId">;
export type IntegrationConnectionId = OpaqueId<"IntegrationConnectionId">;
export type AgentActionId = OpaqueId<"AgentActionId">;
export type OutboxEventId = OpaqueId<"OutboxEventId">;
export type ExternalActionContentId = OpaqueId<"ExternalActionContentId">;
export type AuditEventId = OpaqueId<"AuditEventId">;

export function parseOpaqueId<TBrand extends string>(
  kind: TBrand,
  value: unknown,
): Result<OpaqueId<TBrand>, SafeError> {
  if (typeof value !== "string") {
    return invalidOpaqueId(kind, "ID must be a string.");
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return invalidOpaqueId(kind, "ID must not be empty.");
  }

  return ok(normalized as OpaqueId<TBrand>);
}

export function parseWorkspaceId(value: unknown): Result<WorkspaceId, SafeError> {
  return parseOpaqueId("WorkspaceId", value);
}

export function parseDesktopClientId(value: unknown): Result<DesktopClientId, SafeError> {
  return parseOpaqueId("DesktopClientId", value);
}

export function parseIntegrationConnectionId(
  value: unknown,
): Result<IntegrationConnectionId, SafeError> {
  return parseOpaqueId("IntegrationConnectionId", value);
}

export function parseAgentActionId(value: unknown): Result<AgentActionId, SafeError> {
  return parseOpaqueId("AgentActionId", value);
}

export function parseOutboxEventId(value: unknown): Result<OutboxEventId, SafeError> {
  return parseOpaqueId("OutboxEventId", value);
}

export function parseExternalActionContentId(
  value: unknown,
): Result<ExternalActionContentId, SafeError> {
  return parseOpaqueId("ExternalActionContentId", value);
}

export function parseAuditEventId(value: unknown): Result<AuditEventId, SafeError> {
  return parseOpaqueId("AuditEventId", value);
}

function invalidOpaqueId<TBrand extends string>(
  kind: TBrand,
  message: string,
): Result<OpaqueId<TBrand>, SafeError> {
  return err(
    createSafeError({
      category: "validation",
      code: INVALID_OPAQUE_ID,
      message,
      safeDetails: { kind },
    }),
  );
}
