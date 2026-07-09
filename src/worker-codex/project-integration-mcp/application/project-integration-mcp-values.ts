import {
  AccessBoundary,
  type BaseRevisionStatus,
  type ProjectIntegrationCheckSpec,
  type ProjectIntegrationPolicy,
} from "@vioxen/subscription-runtime/worker-core";
import type {
  ProjectIntegrationMcpArgs,
  ProjectIntegrationMcpController,
  ProjectIntegrationMcpToolResponse,
} from "../ports/project-integration-mcp-tool-handlers";
import type { JsonObject } from "./project-integration-mcp-handler-contracts";

export function projectIntegrationPolicy(
  controller: ProjectIntegrationMcpController,
  args: ProjectIntegrationMcpArgs,
): ProjectIntegrationPolicy {
  const allowedPathPrefixes = stringArrayArg(args.allowedPathPrefixes);
  const requiredCheckIds = stringArrayArg(args.requiredCheckIds);
  return {
    access: {
      boundary: AccessBoundary.ProjectScopedControl,
      scope: controller.scope,
    },
    ...(allowedPathPrefixes.length ? { allowedPathPrefixes } : {}),
    ...(requiredCheckIds.length ? { requiredCheckIds } : {}),
    ...(controller.scope.allowForcePush === true ? { allowForcePush: true } : {}),
    ...(args.allowStaleBase === true ? { allowStaleBase: true } : {}),
  };
}

export function parseProjectIntegrationChecks(
  value: readonly unknown[] | undefined,
): readonly ProjectIntegrationCheckSpec[] {
  if (value === undefined) return [];
  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`requiredChecks.${index}_invalid`);
    }
    const record = item as Record<string, unknown>;
    const timeoutMs = numberValue(record.timeoutMs);
    return {
      checkId: requiredRawString(record.checkId, `requiredChecks.${index}.checkId`),
      command: requiredStringArrayArg(
        record.command,
        `requiredChecks.${index}.command`,
      ),
      ...(record.cwd === undefined
        ? {}
        : { cwd: requiredRawString(record.cwd, `requiredChecks.${index}.cwd`) }),
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    };
  });
}

export function requiredStringArrayArg(
  value: unknown,
  fieldName: string,
): readonly string[] {
  const values = stringArrayArg(value);
  if (values.length === 0) throw new Error(`${fieldName}_required`);
  return values;
}

export function stringArrayArg(value: unknown): readonly string[] {
  if (value === undefined) return [];
  const values = typeof value === "string" ? [value] : value;
  if (!Array.isArray(values)) throw new Error("string_array_arg_invalid");
  return values.map((item) => {
    if (typeof item !== "string" || item.length === 0) {
      throw new Error("string_array_arg_invalid");
    }
    return item;
  });
}

export function optionalBaseRevisionStatus(
  value: string | undefined,
): BaseRevisionStatus | undefined {
  if (value === undefined) return undefined;
  if (
    value === "current" ||
    value === "stale" ||
    value === "needs_rebase_check" ||
    value === "unknown"
  ) {
    return value;
  }
  throw new Error("project_integration_base_status_invalid");
}

export function assertSafeGitRefName(value: string, fieldName: string): void {
  if (
    value.startsWith("-") ||
    value.includes("..") ||
    /[\s~^:?*\\[\]\x00-\x1f\x7f]/.test(value) ||
    value.endsWith("/") ||
    value.endsWith(".") ||
    value.includes("//") ||
    value.length > 200
  ) {
    throw new Error(`project_control_${fieldName}_invalid`);
  }
}

export function assertSafeGitRemoteName(value: string, fieldName: string): void {
  if (
    value.startsWith("-") ||
    !/^[A-Za-z0-9._-]+$/.test(value) ||
    value.length > 100
  ) {
    throw new Error(`project_control_${fieldName}_invalid`);
  }
}

export function assertSafeGitCommitSha(value: string): void {
  if (!/^[0-9a-fA-F]{7,64}$/.test(value)) {
    throw new Error("project_control_commit_sha_invalid");
  }
}

export function requiredRawString(value: unknown, name: string): string {
  const text = stringValue(value);
  if (!text) throw new Error(`${name} is required`);
  return text;
}

export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function mcpJson(value: JsonObject): ProjectIntegrationMcpToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
  };
}
